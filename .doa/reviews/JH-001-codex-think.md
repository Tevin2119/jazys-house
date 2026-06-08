# JH-001 Conceptual Analysis — Thinker Kang (Seat 3)

**Review ID:** JH-001-THINK-01  
**Date:** 2026-06-07  
**Reviewer:** Codex CLI (gpt-5.5) — Thinker Kang  
**Status:** COMPLETE — Awaiting Council Review  
**Source Artifact:** `.doa/plans/JH-001-plan.md`  
**Design Reference:** `C:\Users\Tevin\jazyshouse\` (static HTML/CSS/JS site, 2,027 LOC)

---

## Executive Summary

The JH-001 plan is well-structured for a Phase 1 foundation but contains **two critical architectural flaws**, **one schema bug**, and **several tenant-isolation and Stripe-security gaps** that must be addressed before Phase 1 implementation begins. Most issues are architectural/conceptual and can be resolved by revising the plan — no code changes are possible yet since the Next.js project hasn't been scaffolded.

**Severity legend:** 🔴 Critical (blocks Phase 1) | 🟠 High (blocks later phases) | 🟡 Medium (design risk) | 🟢 Low (nice-to-have)

---

## 1. Architectural Concerns

### 🔴 1.1 — Middleware DB Query in Edge Runtime (Critical)

The plan specifies:

> Extracting hostname from request → `prisma.tenant.findUnique({ where: { domain: hostname } })`

**Problem:** Vercel Edge Middleware runs in a lightweight runtime that **cannot use standard Prisma Client**. Prisma requires Node.js APIs (net, tls, fs) that are absent in Edge. This will fail at runtime.

**Options to resolve (needs decision before Phase 1):**
- **Option A:** Use `@prisma/client/edge` + Prisma Accelerate or Data Proxy. Adds cost (Accelerate) and latency.
- **Option B:** Move tenant resolution to a server component or layout `layout.tsx` (non-Edge). Works with standard Prisma but loses Edge's speed and geo-distribution.
- **Option C:** Pre-load tenant-domain mappings into Vercel Edge Config or KV at deploy/seed time. Fast, Edge-compatible, but requires keeping KV in sync with DB on tenant changes.

**Recommendation:** Option C for the resolve step, with fallback to DB lookup in layout for cache misses. Also, cache the resolved tenant in `x-tenant-id` header to avoid repeated lookups.

### 🟠 1.2 — No Request-Level Tenant Scoping (High)

The middleware injects `x-tenant-id` into request headers, but the plan relies on **every developer remembering** to filter by `tenantId` on every query. This is fragile.

**Problem:** A single forgotten `where: { tenantId }` clause in any route handler → cross-tenant data leak.

**Recommendation:** Implement a **Prisma client extension or wrapper** in `lib/db.ts` that automatically injects `tenantId` into every query. This provides defense-in-depth:
```ts
// lib/db.ts — NOT implementation, conceptual sketch
const tenantDb = (tenantId: string) =>
  prisma.$extends({
    query: {
      product: { allOperations: ({ args }) => ({ ...args, where: { ...args.where, tenantId } }) },
      order: { allOperations: ({ args }) => ({ ...args, where: { ...args.where, tenantId } }) },
      // ... every tenant-scoped model
    }
  });
```
Without this, the plan's risk mitigation ("every query filters tenantId") is a process control, not an engineering control. Process controls fail.

### 🟠 1.3 — Route Architecture Ambiguity (High)

The plan proposes three tenant resolution strategies simultaneously:
- `jazyshouse.localhost:3000` (subdomain)
- `localhost:3000/jazyshouse` (path prefix)
- `jazyshouse.com` (custom domain → CNAME)

The route structure uses `(store)/[domain]/...` which implies a single URL shape, but subdomain vs. path resolution produce different URL patterns. How does the `[domain]` param work with a subdomain-based tenant? The `[domain]` segment won't exist in the URL path if the tenant is resolved by subdomain.

**Problem:** Route structure is incompatible with subdomain-based resolution. If tenant is resolved by subdomain, the URL is `jazyshouse.localhost:3000/products`, not `localhost:3000/jazyshouse/products`. The `[domain]` dynamic segment would be missing, causing 404s.

**Recommendation:** Pick one primary strategy. Given Vercel's free tier constraints (wildcard subdomains require a paid plan), use **path-prefix as primary** (`/[tenant-slug]/...`) with custom domain support via middleware rewrite (map custom domain → `/[tenant-slug]` internally). Subdomain support can be added later on paid Vercel.

### 🟡 1.4 — Admin Route Collision Risk (Medium)

The plan says `localhost:3000/admin` bypasses tenant context. But what if someone creates a tenant with slug `admin`? The middleware would match `/admin` to the tenant path pattern and resolve it as a tenant, not the admin route.

**Recommendation:** Reserve a blocklist of slugs (`admin`, `api`, `_next`, `favicon.ico`, etc.) and validate on tenant creation. Add middleware check: if path starts with `/admin`, skip tenant resolution entirely.

### 🟡 1.5 — No Indexing Strategy (Medium)

The Prisma schema lacks explicit indexes beyond `@unique` constraints. At scale, queries like:
- `Product.findMany({ where: { tenantId, categoryId, deletedAt: null } })` 
- `Order.findMany({ where: { tenantId, status }, orderBy: { createdAt: 'desc' } })`

will **table-scan** without composite indexes.

**Recommendation:** Add `@@index([tenantId, categoryId])` on Product, `@@index([tenantId, status, createdAt])` on Order, `@@index([tenantId, createdAt])` on CateringInquiry.

### 🟡 1.6 — Images as String[] (Medium)

`images String[]` in the Product model stores URLs as a PostgreSQL text array. This is functional but:
- No per-image metadata (alt text, sort order, primary flag)
- No referential integrity — images can point to deleted blobs
- Migration complexity if switching to an Image model later

**Recommendation:** Start with `images String[]` for Phase 1 speed (it's fine for 59 products). Add a migration note: "If image count exceeds ~200 per product or we need per-image alt text, migrate to a separate `ProductImage` model."

---

## 2. Missing Edge Cases

### 🔴 2.1 — CateringInquiry Missing Tenant Relation (Critical / Schema Bug)

```prisma
model CateringInquiry {
  id        String   @id @default(cuid())
  tenantId  String
  // MISSING: tenant Tenant @relation(fields: [tenantId], references: [id])
  name      String
  ...
}
```

The `tenantId` field has **no Prisma relation declaration** and no `@relation` attribute. This means:
- No foreign key constraint in PostgreSQL → orphaned inquiries possible
- No Prisma-level joins/relations → can't do `prisma.cateringInquiry.findMany({ include: { tenant: true } })`
- Inconsistent with every other model in the schema

**This is a schema bug that must be fixed before migration.** Add:
```prisma
tenant Tenant @relation(fields: [tenantId], references: [id])
```

### 🟠 2.2 — Price Tampering in Checkout (High)

The plan says: client sends cart → server creates Stripe Checkout session. But it doesn't specify **server-side price verification**.

**Problem:** A malicious user can modify the client-side cart to set `price: 0.01` before POSTing to `api/checkout`. If the server trusts these prices, the user pays $0.01 for a $150 Agbada set.

**Recommendation:** The checkout API route MUST:
1. Accept only `productId` and `quantity` (not price) from the client
2. Look up current prices from the database on the server
3. Build the Stripe line items from authoritative DB prices
4. Reject unknown product IDs or products not belonging to the resolved tenant

### 🟠 2.3 — Stock Race Conditions (High)

`stock Int @default(999)` exists but there's no concurrency control.

**Problem:** Two users simultaneously buy the last item in stock. Both read `stock: 1`, both write `stock: 0`. One order succeeds, the other gets an item that doesn't exist.

**Recommendation (Phase 4+):**
- Use Prisma's `updateMany` with a stock condition: `updateMany({ where: { id, stock: { gte: quantity } }, data: { stock: { decrement: quantity } } })` and check `count > 0` to confirm the decrement happened.
- For now (Phase 1), document this as a known risk. With stock at 999 default, race conditions are unlikely before launch.

### 🟠 2.4 — Stripe Webhook Missing Signing Secret Verification (High)

`api/webhooks/stripe/route.ts` is listed but the plan doesn't mention:
- `stripe.webhooks.constructEvent(body, signature, webhookSecret)` — without this, anyone can POST fake `payment_intent.succeeded` events and mark orders as paid.
- `bodyParser: false` configuration — Next.js parses request bodies by default, which breaks Stripe signature verification (needs raw body).
- **Idempotency handling** — Stripe retries webhook deliveries. The same event may arrive twice. Order status updates must be idempotent (check `stripeSessionId` + `stripeEventId` deduplication).

### 🟠 2.5 — No Checkout Session Metadata (High)

The plan's webhook handler updates `order.status = PROCESSING` when `payment_intent.succeeded` fires. But the webhook event doesn't contain the `orderId` or `tenantId` unless they're attached as **session metadata** during creation.

The checkout session creation (`api/checkout/route.ts`) MUST set:
```ts
metadata: { orderId: order.id, tenantId: order.tenantId }
```
The webhook handler MUST read `event.data.object.metadata.orderId` to find the order.

Neither step is mentioned in the plan.

### 🟡 2.6 — Soft Delete Not Enforced in Queries (Medium)

`Product.deletedAt DateTime?` provides soft-delete capability, but the plan doesn't specify that **every product query** needs `where: { deletedAt: null }`. If this is forgotten on a single route, deleted products appear on the storefront.

**Recommendation:** Include `deletedAt: null` in the Prisma extension/client wrapper from §1.2 so it's automatically enforced.

### 🟡 2.7 — Multi-Tenant Stripe Architecture Undefined (Medium)

The plan has a single `lib/stripe.ts` and no per-tenant Stripe configuration. This implies **all tenants share one Stripe account**.

**Implications:**
- All payments flow to one bank account
- Refunds, disputes, and chargebacks are centrally managed
- Tax reporting per tenant is impossible without manual reconciliation
- If a tenant's Stripe account gets restricted, all tenants are affected

**Recommendation:** For Phase 1 with 1-2 tenants (Jazy's House only), single Stripe account is acceptable. But add a `tenant.stripeAccountId String?` field to the schema for future Stripe Connect integration, and design `lib/stripe.ts` to accept a tenantId parameter (even if it's unused for now).

### 🟡 2.8 — Missing Auth Scoping on Admin API Routes (Medium)

The plan lists API routes (`api/products/route.ts`, `api/orders/route.ts`) without specifying authentication. A `TENANT_ADMIN` for tenant A could potentially call the products API with tenant B's ID if auth only checks "is logged in" rather than "is authorized for this tenant."

**Recommendation:** Auth middleware must verify `user.tenantId === requestTenantId || user.role === SUPER_ADMIN`.

### 🟡 2.9 — No Cart Server-Side Validation (Medium)

The plan uses Zustand + localStorage for cart state (Phase 3). At checkout, the server receives the cart from the client.

**Problem:** What if:
- Product was deleted between adding to cart and checkout?
- Price changed between adding to cart and checkout?
- Product stock dropped to zero between adding to cart and checkout?
- Cookie/localStorage was tampered with to add non-existent product IDs?

**Recommendation:** The checkout route MUST validate every cart item against the database (exists, not deleted, in stock, belongs to tenant, current price) before creating the Stripe session. Return validation errors for invalid items.

### 🟡 2.10 — Missing Edge Cases (Quick List)

| Gap | Impact | Phase |
|-----|--------|-------|
| No rate limiting on `api/checkout`, `api/contact`, `api/auth` | Brute-force, abuse | Phase 1-2 |
| No CSRF protection mentioned | Cross-site request forgery on forms | Phase 2 |
| No email system (order confirmations, catering responses) | Customer experience | Phase 3-4 |
| No tax/shipping calculation | £ shown in static site but no logic | Phase 4 |
| No product search implementation detail | "search" listed but no approach | Phase 3 |
| No pagination on product listing | 59 products fine now, 500+ won't be | Phase 3+ |
| No sitemap per tenant (SEO) | Multi-tenant SEO not addressed | Phase 5 |
| No `@@index([email])` on CateringInquiry | Common lookup by email | Phase 1 |
| No audit log for admin actions (who changed what) | Compliance, debugging | Phase 2+ |
| Price history not stored | Can't see price change history | Future |
| Cart abandoned without cleanup | localStorage bloat | Phase 3 |

---

## 3. Tenant Isolation Gaps

### 🔴 3.1 — No Defense in Depth (Critical)

The plan's tenant isolation relies on a **single layer**: the middleware injects `x-tenant-id`, and developers must remember to use it.

**Attack surface if middleware bypassed or forgotten:**
1. Direct API call to `/api/products` without middleware (middleware config matcher might not cover all routes)
2. `getServerSideProps` or server actions that don't read `x-tenant-id`
3. Internal API calls between routes that don't pass context
4. Background jobs / cron that don't have request context

**Recommendation:** Three-layer defense:
- **Layer 1 (Network):** Middleware resolves tenant and injects into header
- **Layer 2 (Data Access):** `lib/db.ts` Prisma extension auto-filters by tenant (see §1.2)
- **Layer 3 (Validation):** Seat 2 (OpenCode Swarm) validates every query has tenant filter during review

### 🟠 3.2 — IDOR on Product/Order Endpoints (High)

URL patterns like `/products/[slug]` and `/orders/[id]` expose identifiers. Without tenant scoping on the lookup:
- `/jazyshouse/products/ankara-dress` → Product for Jazy's House ✓
- Tenant B guesses `ankara-dress` slug → gets Jazy's House product ✗

**Fix:** Product slugs only unique per tenant (`@@unique([tenantId, slug])` is needed — currently Category has this but Product does not!). Product has no unique constraint on `(tenantId, slug)` — only Category does.

Product queries must be: `where: { tenantId, slug }`, not `where: { slug }`.

### 🟠 3.3 — Order Access Without Auth (High)

The plan doesn't specify who can view an order:
- A customer who placed order #123 should see their order
- A customer who knows order #123's ID but didn't place it should NOT see it
- A TENANT_ADMIN for tenant A should NOT see tenant B's order #123

**Recommendation:** Orders need `customerId` (nullable for guest checkout) or at minimum the order confirmation page should require the email used at checkout + order ID (guest access pattern).

### 🟡 3.4 — User Model Tenant Scoping Ambiguity (Medium)

```prisma
model User {
  tenantId String? // null = super admin (all tenants)
}
```

A null `tenantId` means SUPER_ADMIN. But what prevents a TENANT_ADMIN from setting `tenantId = null` via API? The role field is `UserRole` enum, which is separate from `tenantId`.

**Recommendation:** Enforce at the API/auth layer: `role: SUPER_ADMIN` requires `tenantId: null`. `role: TENANT_ADMIN` requires `tenantId: non-null`. Validate on create and update.

### 🟡 3.5 — No Tenant-Aware Prisma Middleware for Cascade (Medium)

When deleting a tenant, cascade must clean up: products, orders, order items, categories, catering inquiries. Prisma supports `onDelete: Cascade` on relations, but none of the relations in the plan specify `onDelete`.

**Recommendation:** Add `onDelete: Cascade` to all `@relation` attributes pointing to Tenant. This ensures referential integrity.

---

## 4. Stripe Security Issues

### 🔴 4.1 — Legacy Key Exposure in Static Site (Critical — Already Exists)

`C:\Users\Tevin\jazyshouse\js\main.js`, line 8:
```js
const STRIPE_KEY = 'pk_test_51Td4PiDTmltTbeAlaza1NFr9ivt1NZS42T4S9I6MoSovcB2lveHKqs57woBVVUbiUrw6OrMW5VywwFX9iruxNgJT00mPMXEnr0';
```

**This is a LIVE publishable Stripe test key.** While publishable keys are designed to be client-visible, this key is tied to a real Stripe account. If this key remains in git history:

1. Anyone who clones the repo has access to the Stripe test key
2. Malicious actors can use it to create test charges, test webhooks, and probe the connected Stripe account
3. If the same Stripe account is used for production, the test key can be used to explore the account's configuration

**Actions needed (not in plan):**
- [ ] Rotate the key in Stripe dashboard immediately
- [ ] Run `git filter-branch` or BFG on the `jazyshouse` repo to scrub the key from all commits
- [ ] Add Stripe key patterns to `.gitignore` in the new platform repo
- [ ] The new platform must NEVER bundle secret keys (`sk_*`) in client code
- [ ] Add a pre-commit hook scanning for `sk_live_` and `sk_test_` patterns

### 🔴 4.2 — Webhook Handler Missing Signature Verification (Critical)

Covered in §2.4 but worth reiterating: without `stripe.webhooks.constructEvent()`, the webhook endpoint is an **open door** for anyone to mark orders as paid.

**Required (not in plan):**
```ts
// Conceptual — NOT implementation
const sig = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
```

Also: `STRIPE_WEBHOOK_SECRET` is not in the Phase 6 environment variables list. Add it.

### 🔴 4.3 — No Idempotency on Webhook Processing (Critical)

Stripe delivers webhooks **at least once**. The same `payment_intent.succeeded` event may arrive twice.

Without idempotency:
1. First delivery: order status → PROCESSING ✓
2. Second delivery: order status → PROCESSING (same, but what if there's side effects like sending confirmation email?)

If email sending is in the webhook handler, the customer gets **duplicate confirmation emails**.

**Recommendation:** 
- Store `stripeEventId` on the Order model
- Before processing: `if (order.stripeEventId === event.id) return 200; // already processed`
- After processing: `order.stripeEventId = event.id`

### 🟠 4.4 — Stripe Secret Key in Environment Variables (High)

The plan lists "Stripe keys" as environment variables in Phase 6. This likely means:
- `STRIPE_SECRET_KEY` (server-side only)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (exposed to client)

**Risk:** If someone accidentally uses `STRIPE_SECRET_KEY` in a client component or `NEXT_PUBLIC_*` prefix, it gets bundled into client-side JavaScript.

The plan acknowledges this risk in §5 ("Stripe key exposure in client code — 🔴 Critical"). But the mitigation ("Codex + Lex audit at Phase 4 gate") is reactive, not preventive.

**Recommendation:** Add a proactive measure:
- `NEXT_PUBLIC_STRIPE_KEY` only ever holds the publishable key (`pk_*`)
- Server-side code uses `process.env.STRIPE_SECRET_KEY` directly (no NEXT_PUBLIC prefix)
- Add a build-time check in `next.config.js` that scans the client bundle for `sk_` patterns
- Never pass the secret key as a prop or to a client component

### 🟠 4.5 — Missing Order ID in Stripe Session Metadata (High)

Already noted in §2.5. To re-emphasize: the webhook handler has **no way to find the order** unless the Stripe session includes `metadata: { orderId }`.

### 🟡 4.6 — Stripe Checkout Session Expiry (Medium)

Stripe Checkout sessions expire after 24 hours. If a customer creates a session and doesn't complete payment:
- The order in DB remains PENDING forever
- No cleanup mechanism exists

**Recommendation:** Add a `checkout.session.expired` webhook handler that marks the order as CANCELLED.

### 🟡 4.7 — No Payment Method/Currency Specification (Medium)

The static site uses `£` (GBP). The Stripe session creation must specify currency. If currency is `usd` and site displays `£`, there's a mismatch. Not specified in plan.

---

## 5. Persona Perspective Gaps

### Dienaba (Owner)
- ✅ Product CRUD covered in Phase 2
- ❌ No bulk product import (59 products to seed, but future additions need bulk upload)
- ❌ No order notification system (she won't know when new orders arrive)
- ❌ No analytics/reporting (orders by day, revenue, popular products)

### Aminata (Customer)
- ✅ Mobile-first storefront in Phase 5
- ❌ No order tracking (how does she know when order ships?)
- ❌ No guest checkout flow specified (User model exists but checkout doesn't reference it)
- ❌ No saved addresses / payment methods

### Tevin (Admin)
- ✅ Multi-tenant isolation acknowledged as critical risk
- ❌ No health-check endpoint for monitoring
- ❌ No backup strategy mentioned
- ❌ No tenant provisioning script (manual DB inserts?)

### Visitor
- ✅ Pages listed in Phase 3
- ❌ No analytics/tracking (how to measure conversion?)
- ❌ No cookie consent for Stripe (Stripe drops cookies — GDPR)

---

## 6. Summary of Required Plan Revisions

| # | Issue | Severity | Resolution |
|---|-------|----------|------------|
| 1 | Middleware DB query in Edge runtime | 🔴 Critical | Decide: Prisma Accelerate, layout-based lookup, or Edge Config |
| 2 | CateringInquiry missing Tenant relation | 🔴 Critical | Add `tenant Tenant @relation(...)` to schema |
| 3 | No Stripe webhook signature verification | 🔴 Critical | Add `constructEvent()` + raw body config + env var |
| 4 | No webhook idempotency | 🔴 Critical | Add stripeEventId to Order, dedup before processing |
| 5 | Legacy Stripe key in static site git history | 🔴 Critical | Rotate key, scrub from git history |
| 6 | No checkout session metadata (orderId link) | 🔴 Critical | Add metadata to session creation, read in webhook |
| 7 | No server-side price verification | 🟠 High | Checkout route must look up prices from DB |
| 8 | No defense-in-depth tenant isolation | 🟠 High | Add Prisma extension in lib/db.ts for auto-filtering |
| 9 | Route structure vs. subdomain resolution clash | 🟠 High | Pick path-prefix as primary strategy |
| 10 | No Stock concurrency control | 🟠 High | Use conditional updateMany with stock check |
| 11 | No auth scoping for admin API routes | 🟠 High | Add tenant-scoped auth checks |
| 12 | Product slug uniqueness not scoped to tenant | 🟠 High | Add @@unique([tenantId, slug]) on Product |
| 13 | Admin slug collision risk | 🟡 Medium | Blocklist reserved slugs on tenant creation |
| 14 | No DB composite indexes | 🟡 Medium | Add @@index on (tenantId, categoryId), (tenantId, status, createdAt) |
| 15 | No cart server-side validation at checkout | 🟡 Medium | Validate cart against DB before Stripe session |
| 16 | Multi-tenant Stripe architecture undefined | 🟡 Medium | Add stripeAccountId field for future Connect |
| 17 | Soft delete not enforced in queries | 🟡 Medium | Include in Prisma extension auto-filter |
| 18 | No rate limiting | 🟡 Medium | Add to API routes |
| 19 | No onDelete cascade on Tenant relations | 🟡 Medium | Add cascading deletes |
| 20 | No CSRF protection | 🟡 Medium | Add CSRF tokens to forms |

---

## 7. Verdict

**The plan is architecturally sound at a high level but has critical implementation gaps that must be resolved before Phase 1 code is written.** The two most urgent architecture decisions are:

1. **How will middleware resolve tenants?** (Edge Config vs. Prisma Accelerate vs. layout-based — this determines the entire routing and data-fetching approach)
2. **How will tenant isolation be enforced?** (Middleware-only is insufficient — needs Prisma-level enforcement)

The Stripe integration is missing three essential pieces: webhook signature verification, idempotency, and session-to-order metadata linkage. Without these, the payment pipeline appears functional but is trivially exploitable.

**Recommendation:** Return this analysis to Prime Kang (Hermes) with a **REVISE** recommendation. The plan should be updated to address all 🔴 Critical items before Phase 1 implementation begins. 🟠 High items can be addressed during implementation with explicit TODO markers.

---

**Signed:** Thinker Kang (Codex CLI)  
**For Council Review:** Prime Kang (Hermes), Workhorse Kang (Claude), Swarm Kang (OpenCode)
