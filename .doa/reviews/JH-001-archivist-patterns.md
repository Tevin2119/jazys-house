# JH-001 ARCHIVIST PATTERN CHECK

**Seat 6 — THE ARCHIVIST (Doom 2099, Earth-928)**
**Date:** 2026-06-07
**Plan under review:** `.doa/plans/JH-001-plan.md`
**Cross-referenced:** CODING-STANDARDS.md, PERSONAS.md, AGENTS.md, COUNCIL-REFERENCE.md
**Previous project audited:** `C:\Users\Tevin\jazyshouse\` (static site: 4 HTML, 1 JS, 1 CSS, PWA)

---

## VERDICT: CONDITIONAL APPROVAL

The plan is sound and directly addresses the static site's critical failures. **7 warnings** require attention before Phase 1 implementation begins; 4 are GATE-level (must fix), 3 are ADVISORY (strongly recommended). No blocking anti-patterns detected.

---

## SECTION 1: STATIC SITE ANTI-PATTERNS — ARE THEY REPEATED?

The static site (`C:\Users\Tevin\jazyshouse\`) had these critical failures. Below, each is checked against JH-001.

### 1A. STRIPE KEY IN CLIENT CODE — 🔴 Critical

| | |
|---|---|
| **Static site:** | `main.js` line 8: `const STRIPE_KEY = 'pk_test_51Td4Pi...';` exposed in browser-deployed JavaScript |
| **JH-001 plan:** | Phase 4 uses server-side Stripe Checkout session creation (`api/checkout/route.ts`). Success metric: "0 Stripe keys in client bundles" (line 304). Risk #1 explicitly calls this out. |

**Assessment:** ✅ FULLY RESOLVED. No keys in client code. Server-side sessions only. Webhook handler receives events server-side.

**GATE CHECK:** Phase 4 gate includes Lex (security) for Stripe audit — correct. But Phase 4 gate says "Hermes + Codex + Lex (security)" for plan review. The protocol says `PLAN GATE → Hermes + Codex (+ OpenCode for risky)`. Given Stripe is the highest-risk phase, **OpenCode should also be on the Phase 4 plan gate**. See Section 3 warning.

---

### 1B. FAKE CHECKOUT (ALERT POPUP) — 🔴 Critical

| | |
|---|---|
| **Static site:** | `checkout()` at line 264-284 of `main.js` — `alert()` popup showing order summary, directing customer to email faye.dienaba@yahoo.com. No payment capture. No order persistence. |
| **JH-001 plan:** | Phase 4: Stripe Checkout session creation, webhook handler (`payment_intent.succeeded → order.status = PROCESSING`), order confirmation page, test with Stripe test cards. |

**Assessment:** ✅ FULLY RESOLVED. Real Stripe integration with server-side sessions, webhooks, and order state machine.

---

### 1C. NO BACKEND / NO DATABASE — 🔴 Critical

| | |
|---|---|
| **Static site:** | Pure static files. Products hardcoded in JS array. Orders never persisted. |
| **JH-001 plan:** | PostgreSQL via Prisma. Full relational schema: Tenant → Category → Product → Order → OrderItem. Seed script to import 59 products from static JS catalog. |

**Assessment:** ✅ FULLY RESOLVED.

---

### 1D. NO ADMIN DASHBOARD — 🔴 Critical

| | |
|---|---|
| **Static site:** | Product changes require editing `main.js` by hand. No order view. No catering inquiry management. |
| **JH-001 plan:** | Phase 2: Admin dashboard with Product CRUD, Order management (list/view/status), Catering inquiry management, Tenant settings. NextAuth with SUPER_ADMIN/TENANT_ADMIN/CUSTOMER roles. |

**Assessment:** ✅ FULLY RESOLVED.

---

### 1E. SINGLE-TENANT, NO ISOLATION — 🔴 Critical

| | |
|---|---|
| **Static site:** | Hardcoded to one store ("Jazy's House Tokyo"). No concept of multi-tenancy. |
| **JH-001 plan:** | Phase 1: Tenant-scoped schema — every model has `tenantId`. Middleware resolves tenant from hostname/path. Admin has tenant switcher. Success metric: "Two tenants can run side-by-side with isolated data" (line 300). |

**Assessment:** ✅ FULLY RESOLVED. Tenant-first architecture matches CODING-STANDARDS.md §Tenant-First Design.

---

### 1F. LOCALSTORAGE-ONLY CART — 🟡 Medium

| | |
|---|---|
| **Static site:** | Cart persisted only in `localStorage`. Lost on device switch, browser clear, or incognito close. |
| **JH-001 plan:** | Phase 3: "Cart — Zustand state, add/remove/qty, persist to localStorage". |

**Assessment:** ⚠️ PARTIALLY RESOLVED. The plan still uses localStorage for cart persistence. Zustand is a state management upgrade but the persistence mechanism is unchanged. For a multi-device e-commerce experience (Aminata persona: mobile-first), this means:

- Cart does not survive across devices (phone ↔ desktop)
- Cart lost if user clears browser data
- No abandoned cart recovery possible (no server-side cart)

**WARNING #1 (GATE):** Server-side cart persistence is needed before launch. At minimum: persist cart to DB on checkout initiation, and ideally sync cart state to server periodically. The Order model already exists — a `Cart` or `CartItem` model with `sessionId` would solve this at low cost. This directly impacts Aminata's persona requirement: "Fast checkout — one tap if possible" (PERSONAS.md line 52).

---

### 1G. NO USER AUTHENTICATION — 🔴 Critical

| | |
|---|---|
| **Static site:** | Anyone can "checkout" — no accounts, no auth. |
| **JH-001 plan:** | Phase 2: NextAuth with role-based access (SUPER_ADMIN, TENANT_ADMIN, CUSTOMER). Admin login gates dashboard. |

**Assessment:** ✅ RESOLVED for admin. For customers: the plan lists CUSTOMER role in User model but doesn't describe customer-facing login/registration flow. Aminata's persona mentions "order tracking" — without customer accounts, how does she track her order? The plan only stores `email` and `name` on the Order model (lines 83-84), which is fine for guest checkout, but tracking requires either an account or an order-lookup-by-email flow.

**WARNING #2 (ADVISORY):** Consider adding a "look up my order" page (email + order ID) or customer account creation post-checkout. Not blocking — guest checkout is valid for MVP — but persona concurrence with Aminata should validate this.

---

### 1H. NO DATA VALIDATION — 🟡 Medium

| | |
|---|---|
| **Static site:** | Newsletter subscribe accepts any input, shows toast, never sends data. Catering form? Not found in JS — likely just HTML with no handler. |
| **JH-001 plan:** | Coding standard says "Always validate on the server, even if you validate on the client" (CODING-STANDARDS.md line 108). API routes handle checkout, contact, webhooks. |

**Assessment:** ✅ RESOLVED by architectural design (API routes + server components enforce server-side validation). No explicit validation strategy document, but the plan's architecture makes client-only validation impossible for critical paths.

---

### 1I. INLINE STYLES / TEMPLATE HTML GENERATION — 🟢 Low

| | |
|---|---|
| **Static site:** | `showToast()` creates DOM elements with inline `style.cssText`. `renderProducts()` uses `innerHTML` with template literals — XSS vector if product data were user-controllable. |
| **JH-001 plan:** | Phase 1: "Tailwind + shadcn/ui configuration". CODING-STANDARDS.md §Styling Rules: "Use Tailwind utility classes exclusively. No inline styles except for dynamic values." |

**Assessment:** ✅ RESOLVED. React/Next.js with Tailwind eliminates this class of problems. JSX escapes by default.

---

## SECTION 2: SCHEMA & ARCHITECTURE PATTERN REVIEW

### 2A. `price: Float` — Anti-Pattern Detected 🔴

```prisma
// Plan, line 65:
price  Float
```

This is a textbook anti-pattern for financial data. Floating-point arithmetic introduces rounding errors (e.g., `0.1 + 0.2 !== 0.3`). In e-commerce, this can cause incorrect totals, tax miscalculations, and reconciliation failures.

Prisma supports `Decimal` for exact precision:

```prisma
price  Decimal  @db.Decimal(10, 2)
```

Or use integer cents:

```prisma
priceCents  Int  // £12.50 → 1250
```

**WARNING #3 (GATE):** Change `price: Float` to `Decimal` or `Int` (cents) across all models (Product, OrderItem, Order.total). This is a data integrity issue that is painful to fix post-migration. CODING-STANDARDS.md does not explicitly call this out, which is itself a gap in the standards doc.

---

### 2B. `images String[]` Without Image Model — Pattern Concern 🟡

```prisma
// Plan, line 67:
images  String[]  // URLs (Vercel Blob or Cloudinary)
```

Storing image URLs as a string array on Product works for an MVP, but it:

1. Loses image metadata (alt text, dimensions, order/priority, upload date)
2. Makes it hard to reuse images across products or tenants
3. Complicates bulk image operations (migrate from one storage to another)
4. No soft-delete or orphan detection for unused images

**WARNING #4 (ADVISORY):** Consider a lightweight `ProductImage` model:

```prisma
model ProductImage {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  url       String
  alt       String?
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
}
```

This is not blocking for Phase 1 but will save migration pain. The static site's 63 images with hardcoded paths will need mapping anyway.

---

### 2C. No Soft Delete on Orders — Standards Violation 🟡

CODING-STANDARDS.md §Soft Deletes says: "Prefer soft deletes for user-facing data". The plan adds `deletedAt` to Product (line 71) but NOT to Order, OrderItem, or CateringInquiry.

Orders are user-facing data and should be soft-deletable for compliance, audit trails, and accident recovery. Hard-deleting an order loses the financial record.

**WARNING #5 (ADVISORY):** Add `deletedAt DateTime?` to Order and CateringInquiry models. This is a low-cost addition that prevents irreversible data loss.

---

### 2D. `theme: Json?` on Tenant vs. `lib/theme.ts` — Inconsistency 🟢

The plan stores theme as `Json?` on the Tenant model (line 41), but CODING-STANDARDS.md §Tenant Theming (line 177) says: "Define CSS custom properties per tenant in `lib/theme.ts` — Apply via `<style>` tag in root layout using tenant config."

These two approaches are compatible — `lib/theme.ts` reads the JSON from the tenant and generates CSS variables. But the standards doc and plan should explicitly connect this. Minor documentation alignment issue, not blocking.

---

### 2E. No Rate Limiting Strategy — Security Gap 🟡

The plan has API routes for checkout, contact form, webhooks — none mention rate limiting. The static site had no such concern (it was static files), but the new platform is dynamic and exposes endpoints that could be abused:

- `/api/checkout` — could be spammed to create thousands of Stripe sessions
- `/api/contact` — spam vector for catering inquiries
- `/api/webhooks/stripe` — Stripe has its own rate limiting, but still

**WARNING #6 (GATE):** Add rate limiting to the plan. At minimum: Vercel's built-in rate limiting or a simple in-memory limiter in middleware for the checkout and contact endpoints. This is a Lex (security) concern that should be flagged in the Phase 4 gate.

---

### 2F. No Email Integration — Persona Gap 🟡

PERSONAS.md for Dienaba: "Notification anxiety — 'did someone order something while I was cooking?'" and "Catering inquiry management: Inquiries come in but get lost in email."

The plan has no email service integration (Resend, SendGrid, Postmark). Without it:

- No order confirmation emails to customers (Aminata: "Where's my order?")
- No new-order notifications to Dienaba
- No catering inquiry auto-replies
- No abandoned cart recovery

**WARNING #7 (GATE):** Add email integration to the scope. Resend has a generous free tier (100 emails/day) and a Next.js SDK. This should be in Phase 4 (checkout) or Phase 2 (admin notifications). Without it, persona concurrence with Dienaba is incomplete.

---

## SECTION 3: CLUBRIGHT COUNCIL PATTERN COMPLIANCE

The JH-001 plan was drafted following the Council of Kangs V6 protocol (COUNCIL-REFERENCE.md). Below is the compliance audit.

### 3A. Council Review Gates — Table Alignment

| Protocol Step | Plan Mapping | Status |
|---|---|---|
| Step 4: PLAN GATE (Hermes + Codex + OpenCode for risky) | Phase gates table (lines 218-225) | ⚠️ ISSUE |
| Step 5: CLAUDE IMPLEMENT | "Claude" in Implementation column for all phases | ✅ |
| Step 6: OPENCODE VALIDATE | "OpenCode + Codex" in Validation column | ✅ |
| Step 7: CODEX BACKVALIDATE | Codex listed in Validation column (back-validate after OpenCode) | ✅ |
| Step 8: MAKER (4-perspective) | Not in the gate table | ⚠️ ISSUE |
| Step 9: ADVERSARY (Lex) | Only Phase 4 (Stripe security) includes Lex | ⚠️ ISSUE |
| Step 10: ARCHIVIST (Doom) | Not in the gate table (this review is the first) | ✅ (now complete) |
| Step 11: EVIDENCE (screenshots) | Not mentioned in plan | ⚠️ ISSUE |
| Step 12: COUNCIL MINUTES | "Council minutes" in Sign-off column | ✅ |

### 3B. Specific Protocol Deviations

**DEVIATION #1 — Maker (Seat 4) missing from gates:** The gate table (lines 218-225) does not include THE MAKER (Reed) as a reviewer for any phase. The protocol says Step 8: "MAKER — 4-perspective synthesis → `08-maker-synthesis.md`". Reed's multi-perspective synthesis (Developer + Operator + Member + Visitor) should gate every phase, but at minimum Phase 3 (storefront — all four perspectives converge). The persona concurrence table (lines 286-293) partially addresses this but does not substitute for Reed's structured 4-perspective synthesis.

**DEVIATION #2 — Adversary (Lex) only on Phase 4:** The gate table only includes Lex for Phase 4 (Stripe). But security concerns exist in:
- Phase 1: Prisma schema (cross-tenant data leak prevention starts here)
- Phase 2: Auth configuration (NextAuth setup, role-based access)
- Phase 6: Deploy (environment variables, Vercel config, CORS)

Lex should at minimum review Phase 1 schema and Phase 2 auth, even if lighter touch than the full Phase 4 audit.

**DEVIATION #3 — OpenCode missing from Phase 4 plan gate:** Protocol says `PLAN GATE → Hermes + Codex (+ OpenCode for risky)`. The plan gate for Phase 4 says "Hermes + Codex + Lex (security)" but does NOT include OpenCode. Given that Phase 4 (Stripe checkout, webhooks, payment processing) is the highest-risk phase, OpenCode should be in the plan gate per protocol.

**DEVIATION #4 — No evidence-gathering step:** Protocol Step 11 says "EVIDENCE → Screenshots, persona concurrence." The plan's Success Metrics include pixel-matching and PWA installability, but there's no explicit evidence-gathering step per phase. Persona concurrence table exists but is a one-time check, not per-phase validation.

**DEVIATION #5 — Persona concurrence scope:** Visitor persona is only validated at Phase 3 (storefront), but Visitor also needs to validate: (a) middleware routing — can a visitor land on the right storefront? (Phase 1), (b) deploy — is the site accessible on the public internet? (Phase 6).

### 3C. Protocol Pattern Compliance (Non-Gate)

| Rule | Compliance |
|---|---|
| "Hermes NEVER writes code" — plan drafted by Hermes, implementation delegated to Claude | ✅ PASS |
| "No artifact = no seat" — plan references specific files, schema, routes | ✅ PASS |
| "Never Claude -p" — Claude is invoked via orchestrator for implementation | ✅ PASS (by design) |
| "Screenshots are the golden parachute" — no evidence step in plan | ⚠️ FAIL (see Deviation #4) |
| Council cost tracking — not in plan but not required for a plan doc | N/A |
| Account map — consistent with AGENTS.md seat assignments | ✅ PASS |

---

## SECTION 4: ANTI-PATTERN WATCHLIST

These are patterns that are NOT anti-patterns today but could become anti-patterns if the plan is followed rigidly without adaptation.

### 4A. "Phase Complete" Mentality

The plan divides work into 6 sequential phases over 11 days. In practice, e-commerce checkout (Phase 4) and admin CRUD (Phase 2) will need cross-cutting: the admin needs to see orders before checkout is fully built (for testing), and checkout needs product data from the admin. The phases should be treated as priorities, not strict gates. The plan acknowledges this implicitly through the council review gates, but the rigid day assignments (Days 1-2, 3-4, etc.) risk waterfall-style thinking.

### 4B. 59-Product Seed Script Blind Spot

The plan says "Seed script: import 59 products from `js/main.js` into DB" (line 141). The path `js/main.js` is ambiguous — is this relative to the repo root? The actual source is `C:\Users\Tevin\jazyshouse\js\main.js`. The seed script needs to account for:

- Products without images (`img: null` — lines 14, 17, 20, etc. — at least 15 products)
- BadgeClass values that are CSS classes from the static site's stylesheet (won't map 1:1 to Tailwind)
- Product IDs like `w1`, `m2`, `k3` (not meaningful — should generate slugs)

### 4C. Cuid vs UUID for Multi-Tenant IDs

The plan uses `@default(cuid())` for all model IDs. Cuid is fine but if these IDs appear in URLs (e.g., `/products/[slug]` — the plan uses slug, not ID, so this is fine for customer-facing routes). However, for admin-facing IDs or API endpoints, ensure IDs are not guessable if they grant access to cross-tenant data. The plan's middleware + tenant-scoped queries already handle this, but it's worth noting.

---

## SECTION 5: WHAT THE PLAN GETS RIGHT

These deserve explicit recognition:

1. **Tenant-first architecture from day one** — the static site's biggest limitation was single-tenancy. The plan makes multi-tenancy the foundation, not an afterthought.

2. **Stripe key risk is the #1 listed risk** — shows institutional learning from the static site's embedded key.

3. **Soft deletes on Product** — matches CODING-STANDARDS.md and shows attention to data safety.

4. **Council review gates at every phase** — the plan doesn't assume anyone gets it right alone.

5. **Persona concurrence table** — explicitly maps features to Dienaba, Aminata, Tevin, and Visitor.

6. **Success metrics are specific and measurable** — "0 Stripe keys in client bundles", "Two tenants can run side-by-side", "All 59 products importable".

7. **Middleware design** — the hostname → path-prefix fallback chain is pragmatic for development without custom domains.

---

## SECTION 6: SUMMARY OF REQUIRED ACTIONS

### GATE-LEVEL (Must fix before Phase 1 begins):

| # | Issue | Section |
|---|-------|---------|
| W1 | **Server-side cart persistence needed** — localStorage-only cart fails Aminata's multi-device requirement | 1F |
| W3 | **`price: Float` → `Decimal` or `Int` (cents)** — floating-point for money is a data integrity anti-pattern | 2A |
| W6 | **Add rate limiting strategy** — checkout and contact endpoints need protection | 2E |
| W7 | **Add email integration to scope** — Dienaba's notification anxiety and Aminata's order confirmation are persona requirements without an implementation plan | 2F |

### COUNCIL PROTOCOL FIXES (Adjust gate assignments):

| # | Issue | Section |
|---|-------|---------|
| D1 | **Add Maker (Seat 4, Reed) to gate table** — at minimum Phase 3 (storefront 4-perspective synthesis) | 3B |
| D3 | **Add OpenCode to Phase 4 plan gate** — Stripe is the highest-risk phase per protocol | 3B |
| D4 | **Add explicit evidence-gathering step per phase** — screenshots, persona concurrence checkpoints | 3B |

### ADVISORY (Strongly recommended, not blocking):

| # | Issue | Section |
|---|-------|---------|
| W2 | Consider customer order lookup or post-checkout account creation | 1G |
| W4 | Consider `ProductImage` model instead of `String[]` URLs | 2B |
| W5 | Add `deletedAt` to Order and CateringInquiry models | 2C |
| D2 | Extend Lex (Adversary) review to Phase 1 (schema) and Phase 2 (auth config) | 3B |
| D5 | Add Visitor persona validation to Phase 1 and Phase 6 | 3B |

---

**Signed:** THE ARCHIVIST — Doom 2099, Earth-928
**Pattern database updated:** Static site anti-patterns cataloged. JH-001 patterns tracked.
**Next:** Return to Prime Kang (Hermes) for council minutes and sign-off.
