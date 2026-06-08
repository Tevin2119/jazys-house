# JH-001 Adversarial Security Audit (Kryptonite Scan)

**Seat:** 5 — THE ADVERSARY (Lex Luthor, Earth-38)
**Plan:** JH-001 (Jazy's House Platform — Multi-Tenant E-Commerce)
**Audited:** 2026-06-07
**Disposition:** ⚠️ NOT YET SAFE — 6 Critical, 9 High, 5 Medium findings

---

## Executive Summary

The JH-001 plan outlines a sound architecture in principle, but it is a **plan, not an implementation** — and plans don't ship secure code. The architecture sketch has multiple unaddressed attack surfaces that WILL become vulnerabilities at implementation time unless explicitly hardened. The plan's risk register acknowledges two of the biggest threats (Stripe key exposure, cross-tenant data leaks) but the mitigation strategies are aspirational ("Codex + Lex audit", "OpenCode validates") rather than prescriptive. This audit identifies **20 specific vulnerability classes** across the six requested attack surfaces.

**Bottom line:** The plan is architecturally sound enough to proceed, but every Phase must bake in the hardening recommendations below before reaching Production. Phase 4 (Checkout) is the highest-risk gating point.

---

## Finding Severity Scale

| Severity | Description |
|----------|-------------|
| 🔴 CRITICAL | Direct path to financial loss, data breach, or platform compromise |
| 🟠 HIGH | Exploitable with moderate effort; secondary but severe impact |
| 🟡 MEDIUM | Hardening gap; low exploitability but high consequence if chained |
| 🟢 LOW | Best-practice gap; defense-in-depth |

---

## 1. Stripe Key Exposure Vectors

### 🔴 C-1: Publishable vs. Secret Key Confusion

**Finding:** The plan's success metric states "0 Stripe keys in client bundles" (line 304). This is **dangerously misleading**. Stripe's *publishable key* (`pk_*`) MUST be in the client bundle — it's the only key Stripe.js uses. The *secret key* (`sk_*`) must NEVER reach the client. Without a clear naming convention (e.g., `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` vs. `STRIPE_SECRET_KEY`), a developer will inevitably expose the wrong one.

**Exploitation:** If the secret key leaks to the browser (via `NEXT_PUBLIC_` prefix or accidental import), any attacker can:
- Create charges, refunds, and transfers on the Stripe account
- Read all customer payment data
- Issue full refunds on every order
- Exfiltrate the connected bank account details

**Recommendation:**
- **Hard requirement:** Enforce a pre-commit hook that scans for `sk_live_` and `sk_test_` in any file reachable from client entry points
- Document the exact env var names in `.env.example` with loud comments: `# ⛔ NEVER prefix this with NEXT_PUBLIC_`
- Use the `server-only` package to mark `lib/stripe.ts` as server-only — any client-side import will fail at build time

### 🟠 H-1: Missing Webhook Secret in Environment Docs

**Finding:** The plan mentions "Stripe keys" (plural) in environment variables (line 208) but never names `STRIPE_WEBHOOK_SECRET`. Without this, webhook signature verification is impossible — and without it, the webhook endpoint is trivially spoofable (see finding C-4).

**Recommendation:** Add `STRIPE_WEBHOOK_SECRET` to the explicit env var list. The webhook route must call `stripe.webhooks.constructEvent()` with the raw request body — not the parsed JSON body.

### 🟠 H-2: Build-Time Secret Leak via Next.js `NEXT_PUBLIC_*`

**Finding:** Next.js inlines all `NEXT_PUBLIC_*` environment variables at build time into the JavaScript bundle. The plan's `lib/stripe.ts` will need the secret key — if any developer writes `NEXT_PUBLIC_STRIPE_SECRET_KEY` (a common mistake), it's permanently baked into the bundle.

**Recommendation:** Add this to the `.env.example` with a stern warning. Include a CI check that greps the build output for `sk_live_` and `sk_test_`.

### 🟡 M-1: `.env` in Git History Risk

**Finding:** No mention of `.env` in `.gitignore` or git-secrets scanning. The static site already had "Stripe test key embedded" (line 19) — the same team behavior pattern may repeat with the Next.js project.

**Recommendation:** Add `.env`, `.env.local`, `.env.*.local` to `.gitignore` immediately. Use `git-secrets` or `detect-secrets` in CI.

---

## 2. Auth Bypass Possibilities

### 🔴 C-2: Header-Based Tenant Injection — Trivial Spoofing

**Finding:** The middleware plan (lines 148-156) resolves the tenant from the `Host` header or path prefix, then **injects it as `x-tenant-id` header** for downstream route handlers. The plan does NOT specify that the middleware must **strip or overwrite any incoming `x-tenant-id` header**. 

**Exploitation:**
```bash
# Attacker bypasses hostname resolution entirely:
curl -H "x-tenant-id: tenant-B" https://jazyshouse.com/api/products
# Middleware resolves tenant-A from hostname...
# ...but does it overwrite the existing x-tenant-id?
# If NOT: attacker controls which tenant's data they access.
```

Even if the middleware overwrites the header, every API route must exclusively trust the middleware-set value and NEVER read `x-tenant-id` from the raw request. A single route that reads the header directly creates a bypass.

**Recommendation:**
- Middleware MUST unconditionally overwrite `x-tenant-id` (or use a request-context pattern like `AsyncLocalStorage` that can't be spoofed from headers)
- All route handlers MUST read tenant from the request-context object, never from `request.headers.get('x-tenant-id')`
- Add a server-side audit log entry whenever tenant context changes mid-request

### 🔴 C-3: Admin Routes Have No Declared Auth Guard

**Finding:** The route structure shows `(admin)/dashboard`, `(admin)/products`, `(admin)/orders`, `(admin)/tenants` — but there is **no admin middleware, no auth check, and no role verification** described anywhere in the plan (lines 178-183 mention "Admin login" but nothing about route protection).

**Exploitation:** Every admin API route (`api/products/route.ts`, etc.) is potentially world-writable unless explicitly guarded at the route level.

**Recommendation:**
- Add an `(admin)/middleware.ts` or a shared `withAuth()` wrapper that checks NextAuth session and role BEFORE any handler executes
- Enforce: TENANT_ADMIN can only access their own tenant's admin panel; SUPER_ADMIN only
- The `api/products/route.ts` must check: (a) is user authenticated, (b) does user's role permit this action, (c) does user's tenantId match the product's tenantId (or is SUPER_ADMIN)

### 🟠 H-3: Role Escalation via `tenantId: null`

**Finding:** The User model (line 114-115) uses `tenantId: String? // null = super admin (all tenants)`. This conflates two concerns: (1) role assignment and (2) tenant membership. If the API allows a user to update their own profile, can a TENANT_ADMIN set `tenantId: null` and become SUPER_ADMIN?

**Exploitation:** Any user-update endpoint that accepts a `tenantId` field is a role escalation vector. The distinction between "has SUPER_ADMIN role" and "has null tenantId" must be enforced server-side.

**Recommendation:**
- NEVER allow users to set their own `role` or `tenantId` fields
- Use a separate `role` check for authorization (enum comparison), not `tenantId === null`
- In the update user API, explicitly strip `role` and `tenantId` from the request body before upsert

### 🟠 H-4: Tenant Switcher May Leak Tenant Enumeration

**Finding:** The admin tenant switcher (line 179) must only list tenants the admin has access to. For SUPER_ADMIN, that's all tenants — acceptable. But if the tenant list API isn't guarded, an unauthenticated attacker can enumerate all tenants on the platform.

**Recommendation:** The tenant listing endpoint must require SUPER_ADMIN role. TENANT_ADMINs only see their own tenant.

### 🟡 M-2: No CSRF Protection Mentioned

**Finding:** NextAuth provides CSRF protection for its own routes, but the plan's custom API routes (`api/products`, `api/checkout`, `api/contact`) have no CSRF protection mentioned. State-changing POST/PUT/DELETE endpoints are vulnerable.

**Recommendation:** Use Next.js built-in CSRF or a token-based approach for all state-changing API routes, especially the admin endpoints.

---

## 3. Cross-Tenant Data Leak Paths

### 🔴 C-4: Product/Category Cross-Tenant Reference Poisoning

**Finding:** The `Product` model has a `categoryId` field (line 62) that references `Category`. But the Prisma schema shows this relationship as:
```prisma
categoryId  String?
category    Category? @relation(fields: [categoryId], references: [id])
```
There is NO compound unique constraint on `(tenantId, categoryId)` and NO check that the referenced Category belongs to the same Tenant as the Product.

**Exploitation:** A TENANT_ADMIN for tenant-A creates a product and sets `categoryId` to a category belonging to tenant-B. This creates a cross-tenant reference. If product queries eagerly load the category, tenant-A can read tenant-B's category data. More dangerously, if category-based product queries exist (e.g., "show all products in category X"), tenant-A can discover products from tenant-B.

**Recommendation:**
- Add a Prisma `@@index([tenantId, categoryId])` and enforce in application code that `category.tenantId === product.tenantId` before linking
- All category-aware product queries must filter by BOTH `tenantId` AND `categoryId`
- Consider a database-level check constraint or trigger (Prisma doesn't support these natively, but a raw SQL migration can)

### 🔴 C-5: Order Cross-Tenant Access via `stripeSessionId` Lookup

**Finding:** The webhook handler must look up the Order by `stripeSessionId`. The plan does not specify that this lookup is scoped to the correct tenant. If the lookup is global (no tenant filter), a webhook for tenant-A's session could update tenant-B's order if Stripe session IDs happen to collide (unlikely with cuid but not impossible, and an attacker could attempt to fabricate collisions).

**More realistic scenario:** The checkout session creation API receives a cart with product IDs. If it doesn't verify that every product belongs to the requesting tenant, a customer on tenant-A's store can add tenant-B's products to their cart and purchase them under tenant-A's pricing/stripe account.

**Recommendation:**
- Checkout session creation MUST verify: `product.tenantId === tenant.id` for every product in the cart
- Webhook handler MUST filter Order lookup by tenant context (derived from the Stripe account or session metadata)
- Embed `tenantId` in Stripe Checkout Session `metadata` and cross-reference it in the webhook

### 🟠 H-5: CateringInquiry Has No Tenant Relation (Missing Foreign Key)

**Finding:** The `CateringInquiry` model (lines 125-136) has `tenantId String` but **no `tenant Tenant @relation(...)`**. This means there's no database-level referential integrity for the tenant relationship. An inquiry can be created with a non-existent `tenantId`, or — more concerning — if the tenant resolution fails and falls through to a default, inquiries could land in the wrong tenant's dashboard.

**Recommendation:** Add `tenant Tenant @relation(fields: [tenantId], references: [id])` to the schema. This also ensures cascade behavior is deliberate.

### 🟠 H-6: No Tenant-Scoped Row-Level Security in PostgreSQL

**Finding:** The plan relies entirely on application-level `tenantId` filtering. PostgreSQL Row-Level Security (RLS) policies are not mentioned. Any raw query, migration script, or Prisma `$queryRaw` that forgets the tenant filter is an immediate data leak.

**Recommendation:** Enable RLS on all tenant-scoped tables:
```sql
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Product"
  USING ("tenantId" = current_setting('app.current_tenant_id'));
```
Set `app.current_tenant_id` in the middleware transaction. This provides a defense-in-depth safety net.

### 🟡 M-3: OrderItem References Product without Tenant Verification

**Finding:** `OrderItem` links to `Product` via `productId`. If a product is soft-deleted (`deletedAt`), the OrderItem retains the reference. But the more pressing concern: if an order from tenant-A references a product from tenant-B (due to cross-tenant checkout manipulation), the reference is silently stored. There's no integrity check.

**Recommendation:** The checkout route must verify product-tenant membership. Additionally, consider embedding `product.tenantId` in `OrderItem` for audit trail.

---

## 4. Input Validation Gaps

### 🔴 C-6: Checkout Price Manipulation — Trusting Client Cart

**Finding:** The cart is implemented with Zustand + localStorage (line 189). This is **entirely client-side state**. The customer's browser sends the cart to the checkout API. If the checkout API trusts ANY price data from the client (product price, line item total, cart total), an attacker can set a $500 product to $0.01 with browser DevTools.

**The plan does not specify HOW prices are resolved during checkout.** The OrderItem has `price Float // Snapshot at time of order` — but WHERE is this snapshot taken? If the client sends `{ productId, quantity, price }`, the server must IGNORE the client price and look up the authoritative price from the database.

**Exploitation:**
```javascript
// Attacker modifies localStorage cart:
localStorage.setItem('cart', JSON.stringify({
  items: [{ productId: 'prod_abc', quantity: 1, price: 0.01 }]
}));
// Checkout API trusts price → $500 product purchased for $0.01
```

**Recommendation:**
- The checkout API MUST accept ONLY `productId` and `quantity` from the client
- Server MUST look up product price from DB at checkout time
- Server MUST calculate the total server-side
- Compare server-calculated total against any client-submitted total and REJECT if they mismatch (anti-tampering)
- Log all price mismatches as potential fraud indicators

### 🟠 H-7: Negative/Zero Price and Stock Values

**Finding:** `Product.price` is `Float` with no constraints. `Product.stock` is `Int @default(999)` with no minimum. An admin can create:
- `price: -50.00` → customer gets paid to "buy" the product
- `price: 0` → free products on a paid store
- `stock: -1` → undefined behavior, potential integer underflow in decrement logic
- `price: Infinity` / `price: NaN` → breaks Stripe amount calculation

**Recommendation:**
- Add validation in the product API: `price > 0`, `stock >= 0`
- Consider a CHECK constraint at the database level
- Use `Decimal` instead of `Float` for monetary values (floating-point rounding WILL cause penny discrepancies at scale)

### 🟠 H-8: Image URL Injection / SSRF

**Finding:** `Product.images` is `String[]` with the comment "URLs (Vercel Blob or Cloudinary)". There is NO URL validation. An attacker (or malicious admin) can set:
- `images: ["file:///etc/passwd"]` — if any server-side image processing fetches these
- `images: ["javascript:alert(document.cookie)"]` — XSS if rendered in `<img src>` without sanitization
- `images: ["http://169.254.169.254/latest/meta-data/"]` — SSRF on cloud metadata endpoints

**Recommendation:**
- Validate all image URLs against an allowlist of domains (Vercel Blob, Cloudinary)
- Use `new URL(url).protocol === 'https:'` as a minimum check
- Sanitize URLs when rendering: use a proper URL construction, not string interpolation
- Never fetch user-supplied URLs from the server without SSRF protection

### 🟠 H-9: Catering Form — No Validation, Unlimited Fields

**Finding:** The catering inquiry form fields (`name`, `email`, `date`, `guests`, `package`, `message`) are accepted with zero validation:
- `email`: no format check — can submit arbitrary strings, including injection payloads
- `guests: Int`: can be 0, -1, or 2,147,483,647 (max int32)
- `message: String`: no max length — 1MB+ payload DoS vector
- `date: String`: not validated as a real date
- No rate limiting — attacker can flood the inquiries table

**Recommendation:**
- Add Zod schema validation to all form endpoints (catering, contact, checkout)
- `email`: `z.string().email().max(255)`
- `guests`: `z.number().int().min(1).max(10000)`
- `message`: `z.string().max(5000)`
- `date`: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`
- Add rate limiting (e.g., 5 submissions per IP per hour)

### 🟡 M-4: XSS via `badgeClass` and `description`

**Finding:** `Product.badgeClass` is documented as "CSS class" (line 69). If rendered directly into a `className` attribute in JSX, it's safe (React escapes). But if rendered into a `style` tag or used in dangerouslySetInnerHTML, it becomes an XSS vector. Similarly, `Product.description` is a free-text string — if rendered with `dangerouslySetInnerHTML` (common for rich text), stored XSS is possible.

**Recommendation:**
- Enforce allowlist for badge classes (only known values: `bg-red-500`, `bg-blue-500`, etc.)
- Sanitize `description` with DOMPurify before rendering if HTML is allowed
- Never use `dangerouslySetInnerHTML` with user-supplied content without sanitization

### 🟡 M-5: Slug Injection — Path Traversal

**Finding:** `Tenant.slug` and `Category.slug` are used in URL construction (path-prefix routing). No validation on slug format. An attacker could create a tenant with slug `../admin` and potentially confuse the router. While Next.js path-based routing is generally safe against traversal, custom middleware that uses slug for file operations could be vulnerable.

**Recommendation:** Validate slug format: `z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)` — alphanumeric + hyphens only, no dots, no slashes.

---

## 5. Checkout Manipulation

### 🔴 (Covered: C-6 above — Price Manipulation via Client-Side Cart)

### 🟠 H-10: Stock Race Condition — Overselling

**Finding:** The plan has `Product.stock` but no mention of atomic decrement. If two customers buy the last item simultaneously:

```
Customer A: reads stock=1 → checkout
Customer B: reads stock=1 → checkout
Both succeed → stock goes to -1 → oversold
```

**Recommendation:**
- Use Prisma's `updateMany` with a `where: { stock: { gt: 0 } }` filter for atomic decrement
- Or use PostgreSQL `SELECT ... FOR UPDATE` or advisory locks
- Stock check must happen INSIDE the checkout transaction, not as a pre-check

### 🟠 H-11: No Idempotency on Checkout Session Creation

**Finding:** The checkout flow creates a Stripe Checkout Session and an Order record. If the customer refreshes the checkout page or double-clicks the button, duplicate sessions and orders are created. The plan has no idempotency mechanism.

**Recommendation:**
- Generate a client-side idempotency key (UUID) at cart-to-checkout transition
- Pass it to the checkout API
- Check for existing Order with that idempotency key before creating a new one
- Stripe supports idempotency keys natively — pass `idempotencyKey` in the session creation call

### 🟠 H-12: Order Manipulation via Reused `stripeSessionId`

**Finding:** `Order.stripeSessionId` is nullable and not unique. If an attacker knows a session ID from a previous successful order, they could potentially:
- Create a new order referencing the old session (if the API allows setting it)
- Trigger the webhook to reprocess the old session against a new order

**Recommendation:** Make `stripeSessionId` `@unique` on the Order model. Never allow the client to set `stripeSessionId` — it should only be set server-side during checkout session creation.

### 🟡 M-6: Cart Tampering via localStorage Injection

**Finding:** Cart state is persisted to `localStorage` with Zustand. Any XSS vulnerability elsewhere on the page (third-party script, compromised CDN, stored XSS in product description) can read/write the cart. An attacker could inject items, modify quantities, or exfiltrate cart contents to track user behavior.

**Recommendation:** This is inherent to client-side state. Mitigations: Content Security Policy (CSP) headers, Subresource Integrity (SRI) for third-party scripts, and server-side cart validation at checkout time (covered above).

---

## 6. Webhook Spoofing

### 🔴 C-7: No Signature Verification → Complete Order Fraud

**Finding:** The webhook handler (`api/webhooks/stripe/route.ts`) is the single most security-critical endpoint in the application. It bridges Stripe events to order status changes. The plan mentions "Stripe keys" but does NOT explicitly call out `STRIPE_WEBHOOK_SECRET` or the signature verification step.

**Without signature verification, ANYONE can:**
```bash
curl -X POST https://jazyshouse.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "metadata": { "orderId": "any-order-id" },
        "amount": 999999
      }
    }
  }'
```
Result: The order is marked as PAID/ PROCESSING without any payment. Products are shipped for free.

**Recommendation:**
- **ABSOLUTE REQUIREMENT:** Every webhook handler MUST call `stripe.webhooks.constructEvent(payload, signature, webhookSecret)`
- The raw request body MUST be preserved (Next.js `export const config = { api: { bodyParser: false } }`)
- If signature verification fails, return 400 — do NOT process the event
- Add integration tests that verify fake webhooks are rejected

### 🟠 H-13: Webhook Replay Attacks

**Finding:** Even with signature verification, an attacker who captures a legitimate webhook POST (e.g., via a compromised logging system, MITM on Vercel internal network, or leaked request logs) can replay it. The plan does not mention idempotency for webhook processing.

**Recommendation:**
- Store processed Stripe event IDs and reject duplicates
- Stripe webhooks include `event.id` — store in a `ProcessedWebhook` table and check before processing
- Stripe sends `idempotency-key` headers — leverage these

### 🟠 H-14: No Webhook IP Whitelist

**Finding:** The plan doesn't mention IP filtering for the webhook endpoint. While signature verification is the primary defense, IP filtering adds a layer of defense-in-depth against volumetric attacks and probing.

**Recommendation:** Configure the webhook route to verify requests originate from Stripe's IP ranges. Vercel middleware can do this efficiently.

### 🟡 M-7: Webhook Body Parsing Conflict

**Finding:** Stripe's `constructEvent()` requires the raw, unparsed request body. Next.js API routes parse the body by default. Without `export const config = { api: { bodyParser: false } }`, the body will be parsed and `constructEvent()` will fail — and a developer might "fix" this by disabling signature verification instead.

**Recommendation:** Add this to the webhook route implementation checklist as a non-negotiable item. Include it in the Phase 4 review gate.

---

## Additional Findings (Beyond Requested Categories)

### 🟠 H-15: No Rate Limiting on Any Endpoint

**Finding:** The plan has zero mention of rate limiting. Every endpoint — checkout, login, catering form, admin API, product search — is vulnerable to brute force, credential stuffing, and resource exhaustion.

**Recommendation:** Use `@upstash/ratelimit` with Vercel KV or similar. Prioritize: auth endpoints, checkout, admin API, public forms.

### 🟠 H-16: NextAuth Secret Exposure

**Finding:** The plan mentions `AUTH_SECRET` as an environment variable (line 208) but provides no guidance on generation or rotation. A weak or default `AUTH_SECRET` compromises all session tokens.

**Recommendation:** Document: `openssl rand -base64 32` for generation. Rotate on any suspected compromise.

### 🟡 M-8: Soft Delete Archipelago — Data Never Really Deleted

**Finding:** `Product.deletedAt` enables soft deletes. While this is good for recovery, it means: (a) product data persists indefinitely including in backups, (b) "deleted" products still appear in order histories, (c) no GDPR/data-deletion compliance path. Not a security vulnerability per se, but a data governance gap.

---

## Attack Chain Scenarios

### Scenario A: The $0 Checkout
```
1. Attacker visits tenant-A's store, adds $200 product to cart
2. Opens DevTools → Application → localStorage → cart
3. Modifies item price from 200 to 0.01
4. Clicks checkout → API trusts client price → Stripe session created for $0.01
5. (If C-6 unmitigated) Order at $0.01 confirmed
```

### Scenario B: Cross-Tenant Data Harvesting
```
1. Attacker signs up as TENANT_ADMIN for their own tenant (tenant-attacker)
2. Creates a product, sets categoryId to a tenant-B category ID (brute-forced or leaked)
3. Calls product listing API for that category
4. Eager-loaded category data reveals tenant-B's product catalog
5. (If C-4 unmitigated) Full catalog exfiltration
```

### Scenario C: Phantom Payment
```
1. Attacker places a legitimate order → Stripe session created → order is PENDING
2. Attacker captures the webhook endpoint URL from JS bundle
3. Crafts a fake payment_intent.succeeded webhook with their order ID
4. POSTs to /api/webhooks/stripe
5. (If C-7 unmitigated) Order marked PROCESSING → shipped without payment
```

### Scenario D: Privilege Escalation to Platform Admin
```
1. Attacker registers as CUSTOMER (tenantId: null)
2. Finds user profile update API endpoint
3. PATCH /api/users/me { "role": "SUPER_ADMIN", "tenantId": null }
4. (If H-3 unmitigated) Attacker is now SUPER_ADMIN on all tenants
5. Accesses all admin dashboards, extracts all order data, deletes tenants
```

---

## Phase Gate Recommendations

| Phase | Security Requirements Before Gate Passes |
|-------|------------------------------------------|
| **Phase 1** | `.env` in `.gitignore`; Zod validation schemas defined; `server-only` on stripe lib; RLS migration ready |
| **Phase 2** | Auth middleware on ALL admin routes; role-based access control; tenant-id isolation in all queries; CSRF on admin APIs |
| **Phase 3** | Input validation on all public forms; rate limiting; CSP headers; slug format validation |
| **Phase 4** | Webhook signature verification (NON-NEGOTIABLE); server-side price resolution; idempotency on checkout; atomic stock decrement; processed webhook dedup |
| **Phase 5** | CSP tightening for PWA; service worker scope restrictions |
| **Phase 6** | Production env var audit (no test keys); Stripe webhook IP allowlist; Vercel security headers |

---

## Verdict

**The JH-001 plan is a well-structured ARCHITECTURAL DOCUMENT but it is NOT a security design.** It correctly identifies two critical risks (Stripe key exposure, cross-tenant leaks) but defers their mitigation to future review gates without prescribing HOW to mitigate them. The plan contains 20 vulnerability classes that would be exploitable if the implementation follows the plan as written, without the hardening measures described above.

**Recommendation: PROCEED WITH HARDENING.** The architecture can be made secure, but every finding in this audit must be addressed before the corresponding phase gate passes. Phase 4 (Checkout + Webhooks) carries the highest risk and should not pass gate without explicit adversarial re-review of the implementation.

---

**Signed,**
Lex Luthor, Earth-38
THE ADVERSARY — Seat 5, Council of Kangs
Kryptonite Scan: COMPLETE — 6 Critical, 9 High, 5 Medium findings
