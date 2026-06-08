# JH-001 SWARM VALIDATION — Standards & Patterns Audit

**Seat 2 — SWARM KANG (OpenCode Validator Mode)**
**Date:** 2026-06-07
**Plan Under Review:** `.doa/plans/JH-001-plan.md`
**Cross-Referenced:** `CODING-STANDARDS.md` (193 lines), `AGENTS.md` (14 lines), `COUNCIL-REFERENCE.md` (147 lines), `PERSONAS.md` (91 lines)
**Prior Reviews Reviewed:** Thinker (Seat 3), Adversary (Seat 5), Archivist (Seat 6), Maker Synthesis (Seat 4)

---

## FINAL VERDICT: ❌ FAIL

**The JH-001 plan fails validation against CODING-STANDARDS.md and AGENTS.md.** 15 standards violations, 7 missing conventions, 6 Prisma query pattern defects, 4 React anti-patterns, and 5 tenant scoping gaps were identified. 13 findings are unique to this review (not raised by prior seats). The plan requires revision before Phase 1 implementation can begin.

---

## SECTION 1: STANDARDS VIOLATIONS (Direct Breaches of CODING-STANDARDS.md)

Each finding maps to a specific rule in the standards document.

### 🔴 V-1: `price: Float` — Monetary Anti-Pattern
| | |
|---|---|
| **Standard:** | CODING-STANDARDS.md does not explicitly call out `Float` for money (this is a gap in standards itself), but the Prisma/Database Rules section mandates correctness. |
| **Plan violation:** | `Product.price Float` (line 65), `Order.total Float` (line 82), `OrderItem.price Float` (line 99) |
| **Why it fails:** | Floating-point arithmetic causes rounding errors (e.g., 0.1 + 0.2 ≠ 0.3). An order of £19.99 may calculate as £19.990000000000002. Stripe expects integer cents. Tax calculations will drift. |
| **Required fix:** | `price Int` (cents, e.g., 1999 = £19.99) OR `Decimal @db.Decimal(10,2)` |
| **Prior reviews:** | Archivist W3 (Gate) — confirmed. Maker synthesis item #5. |

### 🔴 V-2: CateringInquiry Missing `tenant` Relation — Prisma Schema Bug
| | |
|---|---|
| **Standard:** | §Tenant-First Design: "Every data model is tenant-scoped. The `Tenant` table is the root entity." |
| **Plan violation:** | `CateringInquiry` (lines 125-136) has `tenantId String` but **no `tenant Tenant @relation(fields: [tenantId], references: [id])`**. Compare: every other model (Category, Product, Order) has the relation. |
| **Why it fails:** | No foreign key constraint. No Prisma-level joins. Orphaned inquiries possible. Inconsistent with every other model. The standards doc says "every data model" — this model is not properly tenant-scoped. |
| **Required fix:** | Add `tenant Tenant @relation(fields: [tenantId], references: [id])` |
| **Prior reviews:** | Thinker §2.1 (Critical) — confirmed. Adversary H-5. |

### 🔴 V-3: No Transaction Pattern for Multi-Table Writes
| | |
|---|---|
| **Standard:** | §Prisma/Database Rules explicitly requires: "`prisma.$transaction` for atomic multi-table operations" (CODING-STANDARDS.md line 133) |
| **Plan violation:** | The checkout flow (Phase 4) creates an Order + OrderItems simultaneously. The plan does not mention `prisma.$transaction` anywhere. The webhook handler updates `order.status` — also no transaction pattern. |
| **Why it fails:** | Without transactions, an Order can be created without OrderItems (partial failure). The standard's GOOD example explicitly shows `prisma.$transaction([prisma.order.create(...), prisma.cartItem.deleteMany(...)])`. The plan ignores this requirement entirely. |
| **Required fix:** | Phase 4 must specify `prisma.$transaction` for: (a) order creation + order items insert, (b) checkout session creation + order status update, (c) webhook status transition. |
| **Prior reviews:** | Not raised by Thinker, Adversary, or Archivist. **UNIQUE FINDING.** |

### 🟠 V-4: Soft Deletes Not Applied to All User-Facing Models
| | |
|---|---|
| **Standard:** | §Soft Deletes: "Prefer soft deletes for user-facing data" (CODING-STANDARDS.md line 141). The GOOD example shows `deletedAt` and `where: { deletedAt: null }` filtering. |
| **Plan violation:** | `Product.deletedAt` (line 71) exists ✅. But `Order`, `CateringInquiry`, and `OrderItem` have **no soft-delete field**. |
| **Why it fails:** | Orders are the most critical user-facing data. Hard-deleting an order loses financial records, tax history, and customer order references. Inquiries hard-deleted lose customer communication history. The standard says "prefer soft deletes for user-facing data" — the plan only soft-deletes Products, not the most important user data. |
| **Required fix:** | Add `deletedAt DateTime?` to Order and CateringInquiry. Optionally to OrderItem (cascade from Order). |
| **Prior reviews:** | Archivist W5 (Advisory) — partially noted for Order only. CateringInquiry gap is **UNIQUE FINDING.** |

### 🟠 V-5: No Parallel Query Pattern for Independent Fetches
| | |
|---|---|
| **Standard:** | §Async Patterns explicitly requires `Promise.all()` for independent queries: "GOOD — parallel independent queries" / "BAD — sequential independent queries" (CODING-STANDARDS.md lines 62-70). |
| **Plan violation:** | The storefront page (Phase 3) loads products AND categories. The admin dashboard (Phase 2) loads products, orders, and inquiries. Nowhere does the plan specify parallel data fetching. |
| **Why it fails:** | Sequential `await prisma.product.findMany()` then `await prisma.category.findMany()` doubles page load time for no reason. The standards doc has an explicit GOOD/BAD example for exactly this scenario. |
| **Required fix:** | Phase 3 data fetching must specify `const [products, categories] = await Promise.all([...])` for the storefront. Phase 2 dashboard queries similarly. |
| **Prior reviews:** | Not raised by any prior seat. **UNIQUE FINDING.** |

### 🟠 V-6: No `prisma.$extends` or Tenant-Aware Client Wrapper
| | |
|---|---|
| **Standard:** | §Tenant-First Design: "All queries filter by `tenantId`." §Prisma Client: "Singleton pattern — one `PrismaClient` instance (`lib/db.ts`)." |
| **Plan violation:** | The plan lists `lib/db.ts` but does not mention a Prisma client extension or wrapper that auto-injects `tenantId`. Tenant filtering is left entirely to developer discipline (see V-7 below). |
| **Why it fails:** | The standard requires all queries filter by `tenantId` but provides no mechanism to enforce this. 100% developer discipline = 100% chance of a missed filter. A Prisma `$extends` wrapper in `lib/db.ts` would make tenant-filtering the default, not an opt-in. |
| **Required fix:** | `lib/db.ts` should export a `tenantDb(tenantId)` function that returns a Prisma client with `$extends` auto-filtering `tenantId` on all models. |
| **Prior reviews:** | Thinker §1.2 (High) — identified the need. But Thinker framed it as defense-in-depth. This finding frames it as a **standards compliance issue**: the standard says "all queries filter by tenantId" but the plan provides no mechanism to guarantee it. |

### 🟡 V-7: No Slack/Enforcement for `deletedAt: null` Filter
| | |
|---|---|
| **Standard:** | §Soft Deletes: "Filter soft-deleted records in queries: `where: { tenantId, deletedAt: null }`" (line 148). |
| **Plan violation:** | The plan has `Product.deletedAt` (line 71) but no mechanism to ensure `deletedAt: null` is included in every product query. If a single storefront or admin route forgets this filter, deleted products reappear. |
| **Why it fails:** | Same pattern as V-6 — the standard specifies a requirement but the plan provides only developer discipline to enforce it. |
| **Required fix:** | Include `deletedAt: null` in the Prisma extension/wrapper (see V-6) so it's automatic. |
| **Prior reviews:** | Thinker §2.6 (Medium) — identified. |

### 🟡 V-8: `images String[]` — No Image Model for Metadata
| | |
|---|---|
| **Standard:** | §Prisma/Database Rules: "use include for relations" suggests relations exist where data is related. |
| **Plan violation:** | `images String[]` (line 67) stores URLs without per-image metadata (alt text, sort order, upload date). The static site has 63 images — many will need alt text for accessibility (required for Aminata's persona). |
| **Why it fails:** | While not a direct standards violation (the standard doesn't mandate an image model), it contradicts the relational design pattern used everywhere else in the schema. Every other related entity gets its own model (OrderItem for products-in-orders, Category for product grouping). Images deserve the same treatment. |
| **Required fix:** | Add `ProductImage` model with `url`, `alt`, `sortOrder`, `createdAt`. This can be Phase 1+ but should be acknowledged in the plan as future work. |
| **Prior reviews:** | Thinker §1.6 (Medium). Archivist W4 (Advisory). |

### 🟡 V-9: No `onDelete: Cascade` on Tenant Relations
| | |
|---|---|
| **Standard:** | §Tenant-First Design implies referential integrity. Prisma best practice is explicit `onDelete` on all `@relation` attributes. |
| **Plan violation:** | None of the `@relation` attributes to Tenant specify `onDelete: Cascade` or `onDelete: Restrict`. Deleting a Tenant leaves orphaned Products, Orders, Categories, and Inquiries. |
| **Why it fails:** | Without explicit cascade behavior, tenant deletion is either impossible (FK violation) or silently orphans data. The standard's "Tenant table is the root entity" implies it should own the lifecycle of its children. |
| **Required fix:** | Add `onDelete: Cascade` to all `@relation` fields referencing Tenant: Category, Product, Order, CateringInquiry. |
| **Prior reviews:** | Thinker §3.5 (Medium) — noted. |

### 🟡 V-10: No Server Actions for Simple Mutations
| | |
|---|---|
| **Standard:** | §Forms: "Use Server Actions for simple mutations (add to cart, contact form)" (line 106). |
| **Plan violation:** | The plan lists `api/contact/route.ts` and `api/products/route.ts` but does not mention Server Actions anywhere. The catering inquiry form, contact form, and add-to-cart are all simple mutations that should use Server Actions per the standard. |
| **Why it fails:** | The standard explicitly says Server Actions are the preferred pattern for simple mutations. API routes are for "complex flows (checkout, file uploads)." The plan's file listing shows API routes for contact but no Server Actions. |
| **Required fix:** | Add Server Action files for: catering inquiry submission, contact form, add-to-cart sync (if server-side cart is added per V-12). API routes reserved for checkout and webhooks as the standard specifies. |
| **Prior reviews:** | Not raised by any prior seat. **UNIQUE FINDING.** |

---

## SECTION 2: MISSING CONVENTIONS (Required by Standards, Absent from Plan)

### 🔴 M-1: No Testing Strategy (Complete Omission)
| | |
|---|---|
| **Standard mandate:** | §Testing Rules specifies: "E2E (Playwright) — Test critical flows: browse → add to cart → checkout, admin product CRUD, tenant switching" and "Unit Tests (Vitest) — Test `lib/` utilities: tenant resolution, Stripe helpers, auth config" (lines 183-194). |
| **Plan state:** | **Zero mention of testing.** No Playwright config. No Vitest config. No test files in the file tree. No success metric for test coverage. |
| **Severity:** | CRITICAL. The standard dedicates an entire section to testing with specific tool choices and priority levels (P0: checkout, P1: admin CRUD). The plan completely omits this. An e-commerce platform without tests will break on deploy. |
| **Required fix:** | Add a testing phase or integrate tests into each implementation phase. Minimum: Playwright smoke test for checkout, Vitest for `lib/tenant.ts` and `lib/stripe.ts`. |
| **Prior reviews:** | Not raised by Thinker, Adversary, or Archivist. **UNIQUE FINDING — no prior seat caught the complete testing omission.** |

### 🔴 M-2: No Error Handling Pattern Specified
| | |
|---|---|
| **Standard mandate:** | §Error Handling (lines 46-57) provides explicit GOOD/BAD examples with try/catch returning `{ success, error }` objects. The BAD example is "silently swallowing errors" via `.catch(() => null)`. |
| **Plan state:** | No error handling strategy mentioned. No discussion of error boundaries (`error.tsx`). No specification for API error responses. No loading states (`loading.tsx`). |
| **Severity:** | CRITICAL. The standard explicitly shows the expected pattern. The plan doesn't address it. Without conventions, each route handler will handle errors differently (or not at all). |
| **Required fix:** | Add an error handling convention to the plan: all `lib/` functions return `{ success, data } | { success: false, error }`. All API routes use consistent error shapes. Add `error.tsx` and `loading.tsx` to route groups. |
| **Prior reviews:** | Not raised by any prior seat. **UNIQUE FINDING.** |

### 🟠 M-3: No Component Structure Rules
| | |
|---|---|
| **Standard mandate:** | §Component Structure: "Keep files under 300 lines — extract sub-components into co-located files", "One component per file", "Use named exports for components, default exports for pages/routes" (lines 77-80). |
| **Plan state:** | The file tree (lines 265-268) groups components into `store/` and `admin/` directories but doesn't specify file-per-component, line limits, or export conventions. |
| **Why it matters:** | Without explicit conventions, the Phase 3 storefront components (ProductCard, ProductGrid, CartPanel, etc.) risk becoming monoliths. The standard has specific rules — the plan should acknowledge them. |
| **Required fix:** | Add a note in Phase 1 or Phase 3 that all components follow CODING-STANDARDS.md §Component Structure. |
| **Prior reviews:** | Not raised by any prior seat. **UNIQUE FINDING.** |

### 🟠 M-4: No `cn()` or Conditional Class Pattern
| | |
|---|---|
| **Standard mandate:** | §Styling Rules: "Use `cn()` utility from `@/lib/utils` for conditional classes" (lines 167-174). |
| **Plan state:** | `lib/utils.ts` is listed (line 275) but with no mention of what it contains. The `cn()` utility is implied but not explicit. |
| **Why it matters:** | Minor but worth noting — the standard has a specific pattern with a code example. The plan should confirm `cn()` is in scope. |
| **Required fix:** | Add a note that `lib/utils.ts` exports `cn()` from `clsx` + `tailwind-merge` per standard. |
| **Prior reviews:** | Not raised. Minor finding. |

### 🟠 M-5: No Rate Limiting Strategy
| | |
|---|---|
| **Standard mandate:** | §Forms: "Always validate on the server" (implies protection). The standard doesn't explicitly require rate limiting but it's a security baseline. |
| **Plan state:** | No rate limiting on `api/checkout`, `api/contact`, or `api/auth`. |
| **Severity:** | HIGH — three prior reviews flagged this (Thinker §2.10, Adversary H-15, Archivist W6). This is a **consensus finding** across all seats. |
| **Required fix:** | Add rate limiting to the plan. At minimum for checkout, contact, and auth endpoints. |
| **Prior reviews:** | Thinker, Adversary, Archivist — all flagged. |

### 🟡 M-6: No Explicit Return Types on Exported Functions
| | |
|---|---|
| **Standard mandate:** | §TypeScript Rules: "GOOD — explicit return types on exported functions: `async function getTenant(hostname: string): Promise<Tenant | null>`" (lines 29-31). |
| **Plan state:** | The plan doesn't address TypeScript conventions at all. The middleware pseudocode (lines 148-156) shows `prisma.tenant.findUnique({...})` without return types. |
| **Why it matters:** | The standard's first code example demonstrates this pattern. Not enforcing it means the codebase will drift from the standard immediately. |
| **Required fix:** | Add "All exported functions in `lib/` must have explicit return types" to Phase 1 conventions. |
| **Prior reviews:** | Not raised by any prior seat. **UNIQUE FINDING.** |

### 🟡 M-7: No Loading/Error Boundary Files in File Tree
| | |
|---|---|
| **Standard mandate:** | §Forms: "Show loading states during form submission" (line 109). §Data Fetching implies progressive enhancement. |
| **Plan state:** | The file tree (lines 245-281) lists page files but no `loading.tsx` or `error.tsx` files in any route group. |
| **Why it matters:** | Next.js 15 App Router supports `loading.tsx` (Suspense boundary) and `error.tsx` (Error boundary) per route. Without them, users see blank pages during data fetches and unhandled errors crash the page. |
| **Required fix:** | Add `loading.tsx` and `error.tsx` to `(store)/` and `(admin)/` route groups. |
| **Prior reviews:** | Not raised by any prior seat. **UNIQUE FINDING.** |

---

## SECTION 3: PRISMA QUERY PATTERN DEFECTS

### 🔴 P-1: Product Missing `@@unique([tenantId, slug])`
| | |
|---|---|
| **Finding:** | Category has `@@unique([tenantId, slug])` (line 55). Product has **no** unique constraint on `(tenantId, slug)`. The product detail page route is `[domain]/products/[slug]` — if two tenants both create a product with slug `ankara-dress`, the route is ambiguous. |
| **Query implication:** | `prisma.product.findUnique({ where: { slug } })` finds the wrong product cross-tenant. Must be `where: { tenantId_slug: { tenantId, slug } }` — but this requires a compound unique. |
| **Required fix:** | Add `@@unique([tenantId, slug])` to Product model. |
| **Prior reviews:** | Thinker §3.2 (High) — noted the missing constraint. |

### 🔴 P-2: No Composite Indexes — Table Scans at Scale
| | |
|---|---|
| **Finding:** | The Prisma schema has zero `@@index` declarations. Common queries will table-scan: |
| | - `Product.findMany({ where: { tenantId, categoryId, deletedAt: null } })` — no index |
| | - `Order.findMany({ where: { tenantId, status }, orderBy: { createdAt: 'desc' } })` — no index |
| | - `Order.findUnique({ where: { stripeSessionId } })` — `stripeSessionId` has no index |
| **Standard connection:** | CODING-STANDARDS.md shows query patterns that assume indexed lookups but doesn't mandate indexes. This is a gap in the standards, not the plan — but indexes are essential for production. |
| **Required fix:** | Add: `@@index([tenantId, categoryId])` on Product, `@@index([tenantId, status, createdAt])` on Order, `@@index([tenantId])` on CateringInquiry, `@@unique` on `Order.stripeSessionId`. |
| **Prior reviews:** | Thinker §1.5 (Medium) — noted but didn't list all needed indexes. This finding enumerates them. |

### 🟠 P-3: `Order.stripeSessionId` Not `@unique` — Duplicate Risk
| | |
|---|---|
| **Finding:** | `stripeSessionId String?` (line 87) has no `@unique` constraint. Stripe session IDs are globally unique. If two orders reference the same session (duplicate webhook, retry logic error), data corruption occurs silently. |
| **Required fix:** | Add `@unique` to `stripeSessionId`. |
| **Prior reviews:** | Adversary H-12 — noted the issue but suggested `@unique` as a fix. This confirms it. |

### 🟠 P-4: No `stripeEventId` on Order — Webhook Idempotency Gap
| | |
|---|---|
| **Finding:** | The Order model has no field to store the processed Stripe event ID. Without it, duplicate webhook deliveries can't be deduplicated. Stripe delivers webhooks "at least once." |
| **Query implication:** | The webhook handler must check "have I processed event X already?" — no field exists for this check. |
| **Required fix:** | Add `stripeEventId String?` to Order model. Webhook handler checks `if (order.stripeEventId === event.id) return 200;` |
| **Prior reviews:** | Thinker §4.3 (Critical). Adversary H-13 (High). Consensus finding. |

### 🟡 P-5: `OrderItem` Has No Embedded `tenantId` for Audit Trail
| | |
|---|---|
| **Finding:** | `OrderItem` links to `Product` but has no `tenantId` of its own. If a product's tenant changes or the product is moved, the OrderItem's tenant provenance is lost. For audit/financial reconciliation, the tenant at time of order should be immutable. |
| **Required fix:** | Add `tenantId String` to OrderItem (snapshot at order time). |
| **Prior reviews:** | Adversary M-3 — partially noted. This frames it as a query/audit pattern defect. |

### 🟡 P-6: No Check Constraint on `price` or `stock`
| | |
|---|---|
| **Finding:** | `price Float` and `stock Int` have no validation at the database level. Prisma doesn't support CHECK constraints natively, but the plan should specify application-level validation. A bug could create `price: -50.00` or `stock: -1`. |
| **Query implication:** | `prisma.product.update({ where: { id }, data: { stock: { decrement: quantity } } })` will happily go negative without a guard. |
| **Required fix:** | Application-level: Zod validation on product create/update. DB-level: raw SQL CHECK migration (`price > 0`, `stock >= 0`). |
| **Prior reviews:** | Adversary H-7 (High) — noted negative/zero values. |

---

## SECTION 4: REACT / NEXT.JS ANTI-PATTERNS IN THE PLAN

### 🔴 R-1: Client-Side Cart as Source of Truth for Prices
| | |
|---|---|
| **Anti-pattern:** | The plan uses Zustand + localStorage for cart state (Phase 3, line 189) and sends the cart to `api/checkout`. If the server trusts ANY price or total from the client-side cart, this is a **critical price manipulation vulnerability.** |
| **Standard violation:** | §Forms: "Always validate on the server, even if you validate on the client" (line 108). §Data Fetching: server components should own data. |
| **Fix:** | Checkout API must accept ONLY `{ productId, quantity }` pairs. Server looks up prices from DB. Client cart stores only product IDs and quantities — never prices or totals. Server-calculated total is authoritative. |
| **Prior reviews:** | Thinker §2.2 (High). Adversary C-6 (Critical). Archivist — implicit. **Consensus critical.** |

### 🟠 R-2: `[domain]` Dynamic Segment Without Static Generation
| | |
|---|---|
| **Anti-pattern:** | Every storefront route uses `[domain]` as a dynamic segment (lines 247-254). This means ALL pages are dynamically rendered — no static generation, no ISR, no `generateStaticParams`. For an e-commerce site, this hurts SEO and increases latency. |
| **Why it's an anti-pattern:** | 59 products with known tenants should be statically generated at build time. The `[domain]` param could use `generateStaticParams` to pre-render known tenant pages. |
| **Fix:** | Add `generateStaticParams` to the `[domain]` layout that returns all tenant slugs. Products can use ISR (`revalidate: 3600`). Category pages can be static. |
| **Prior reviews:** | Not raised by any prior seat. **UNIQUE FINDING.** |

### 🟠 R-3: Admin Routes Without Auth Layout Protection
| | |
|---|---|
| **Anti-pattern:** | The admin route group `(admin)/` lists page files but no `layout.tsx` auth guard. Every admin page must independently check auth — the classic "forgotten check on one route" anti-pattern. |
| **Standard violation:** | The plan mentions "NextAuth → SUPER_ADMIN / TENANT_ADMIN" (line 178) but the admin layout has no auth enforcement. |
| **Fix:** | `(admin)/layout.tsx` MUST check session and role before rendering children. Individual admin pages should NOT duplicate auth logic. Same for admin API routes. |
| **Prior reviews:** | Adversary C-3 (Critical) — admin routes have no declared auth guard. This frames it as a React layout anti-pattern specifically. |

### 🟡 R-4: Zustand Cart Without Server Synchronization
| | |
|---|---|
| **Anti-pattern:** | Zustand + localStorage is client-only state. Cart is lost on device switch, browser clear, or incognito close (Archivist W1). From a React perspective: the cart state has no server hydration or synchronization. |
| **Standard connection:** | §Data Fetching encourages server components. Cart state could be managed via a Server Action (`addToCart`) that writes to a server-side cart and rehydrates the client store. |
| **Fix:** | Either: (a) keep localStorage for anonymous browsing but sync to server on user login, or (b) use a `Cart` model with `sessionId` and hydrate Zustand from server on mount. |
| **Prior reviews:** | Archivist W1 (Gate). Maker synthesis item #6. This adds the React-specific anti-pattern angle. |

---

## SECTION 5: TENANT SCOPING CORRECTNESS

### 🔴 T-1: Middleware Header Injection — Trust Boundary Violation
| | |
|---|---|
| **Finding:** | Middleware resolves tenant → injects `x-tenant-id` header (lines 153-156). The plan does NOT specify that the middleware must **overwrite any existing `x-tenant-id` header** from the client. |
| **Exploitation:** | An attacker sends `x-tenant-id: tenant-B` in their request. If middleware doesn't unconditionally overwrite it, downstream route handlers may read the attacker's injected value and access cross-tenant data. |
| **Standard connection:** | §Tenant-First Design: "Middleware resolves tenant from hostname/path before any route handler runs" — but doesn't say "and strips client-supplied tenant headers." The standard itself has a gap here. |
| **Fix:** | Middleware MUST: (1) resolve tenant from hostname/path, (2) **delete** any incoming `x-tenant-id` header, (3) set a new `x-tenant-id` header with the resolved value. Or better: use `AsyncLocalStorage` which can't be spoofed via HTTP headers. |
| **Prior reviews:** | Adversary C-2 (Critical) — identified the spoofing vector. This validates it against the tenant-first design standard. |

### 🔴 T-2: No Defense-in-Depth — Single Layer of Tenant Enforcement
| | |
|---|---|
| **Finding:** | The plan's tenant isolation relies on ONE layer: middleware injects `x-tenant-id`, developers remember to filter by it. No Prisma-level enforcement. No Row-Level Security. No automated validation. |
| **Standard connection:** | §Tenant-First Design says "All queries filter by tenantId" but provides only process control (developers must remember), not engineering control (system enforces it). |
| **Required layers:** | 1. Middleware: resolve tenant from request (already planned). 2. `lib/db.ts` Prisma `$extends`: auto-filter every query by `tenantId`. 3. PostgreSQL RLS: `USING ("tenantId" = current_setting('app.current_tenant_id'))`. 4. Code review: OpenCode validates every query has tenant filter. |
| **Prior reviews:** | Thinker §3.1 (Critical). Maker synthesis consensus. This frames it as a standards compliance gap — the standard requires tenant filtering but doesn't specify enforcement. |

### 🟠 T-3: Admin Route Collision With Tenant Slug
| | |
|---|---|
| **Finding:** | `/admin` bypasses tenant context (line 162). If someone creates a tenant with slug `admin`, the middleware would match `/admin` to a tenant path and route incorrectly. |
| **Standard connection:** | §Tenant-First Design implies tenant slugs should be validated against a reserved list. |
| **Fix:** | Blocklist reserved slugs: `admin`, `api`, `_next`, `favicon.ico`, `robots.txt`, `sitemap.xml`. Validate on tenant creation. Middleware: if path starts with `/admin` or `/api`, skip tenant resolution entirely. |
| **Prior reviews:** | Thinker §1.4 (Medium) — noted but framed as routing collision. This frames it as a tenant scoping issue. |

### 🟠 T-4: Product-Category Cross-Tenant Reference Without Integrity Check
| | |
|---|---|
| **Finding:** | `Product.categoryId` references `Category.id` with no tenant-scoped constraint. A TENANT_ADMIN for tenant-A can set a product's `categoryId` to a category owned by tenant-B. The reference silently crosses tenant boundaries. |
| **Standard violation:** | §Tenant-First Design: "All queries filter by tenantId." But the relationship itself allows cross-tenant references. |
| **Fix:** | Application-level: validate `category.tenantId === product.tenantId` before saving. DB-level: consider a composite FK or CHECK constraint (requires raw SQL migration). |
| **Prior reviews:** | Adversary C-4 (Critical). Thinker §3.2 (High). Consensus. |

### 🟡 T-5: `User.tenantId: null` Confuses Role with Tenant Membership
| | |
|---|---|
| **Finding:** | `tenantId: String? // null = super admin (all tenants)` (line 115) conflates role (SUPER_ADMIN vs TENANT_ADMIN) with tenant membership (null vs tenant ID). |
| **Standard connection:** | §Tenant-First Design: every data model is tenant-scoped. But User's tenantId carries dual meaning — null means both "no tenant" AND "super admin." |
| **Fix:** | Auth logic should check `role` for authorization, not `tenantId`. A SUPER_ADMIN should still be able to have a `tenantId` (their home tenant). The comment on line 115 is misleading. |
| **Prior reviews:** | Thinker §3.4 (Medium). Adversary H-3 (High). |

---

## SECTION 6: COUNCIL PROTOCOL COMPLIANCE (AGENTS.md + COUNCIL-REFERENCE.md)

| Protocol Step | Requirement | Plan Compliance | Status |
|---|---|---|---|
| Step 8: MAKER synthesis | 4-perspective synthesis at every phase | Maker not in gate table for any phase | ❌ FAIL |
| Step 9: ADVERSARY audit | Lex on all phases | Only Phase 4 includes Lex | ❌ FAIL |
| Plan Gate | OpenCode for risky phases | OpenCode missing from Phase 4 plan gate | ❌ FAIL |
| Step 11: EVIDENCE | Screenshots per phase | No evidence-gathering step | ❌ FAIL |
| Visitor persona | Validate at Phase 1 and 6 | Only Phase 3 listed | ❌ FAIL |
| Hermes never writes code | Delegate to Claude | Plan drafted by Hermes, implementation → Claude | ✅ PASS |
| No artifact = no seat | Files must exist | Plan references specific schema, routes, files | ✅ PASS |
| Never Claude -p | Invoke via orchestrator | Not applicable to plan doc | ✅ PASS |

**Protocol grade: 4/8 PASS.** Critical deviations: Maker missing from all gates, OpenCode missing from riskiest phase, no evidence-gathering step.

**Prior reviews:** Archivist §3B identified all of these. This section cross-validates the Archivist's protocol compliance findings.

---

## SECTION 7: FINDINGS UNIQUE TO THIS SWARM VALIDATION

These 13 findings were NOT raised by Thinker, Adversary, or Archivist:

| # | Finding | Section | Severity |
|---|---------|---------|----------|
| 1 | **No testing strategy** (Playwright/Vitest completely absent) | M-1 | 🔴 CRITICAL |
| 2 | **No error handling pattern** specified (try/catch, error boundaries, loading states) | M-2 | 🔴 CRITICAL |
| 3 | **No `prisma.$transaction`** for checkout multi-table writes | V-3 | 🔴 CRITICAL |
| 4 | **No parallel query pattern** (`Promise.all`) for independent fetches | V-5 | 🟠 HIGH |
| 5 | **No component structure rules** (300 lines, one-per-file, named exports) | M-3 | 🟠 HIGH |
| 6 | **No loading.tsx / error.tsx** files in route tree | M-7 | 🟡 MEDIUM |
| 7 | **No explicit return types** convention for `lib/` functions | M-6 | 🟡 MEDIUM |
| 8 | **No Server Actions** for simple mutations (catering, contact, add-to-cart) | V-10 | 🟡 MEDIUM |
| 9 | **Soft deletes missing on CateringInquiry** (only Order was flagged prior) | V-4 | 🟠 HIGH |
| 10 | **`[domain]` dynamic segment without static generation** | R-2 | 🟠 HIGH |
| 11 | **Admin layout without auth guard** (React layout anti-pattern) | R-3 | 🟠 HIGH |
| 12 | **`cn()` utility not explicitly scoped** | M-4 | 🟢 LOW |
| 13 | **No `onDelete: Cascade` on multiple relations** (thinker noted once, this enumerates all) | V-9 | 🟡 MEDIUM |

---

## SECTION 8: VERDICT JUSTIFICATION

### Why FAIL (not PASS, not CONDITIONAL)

The JH-001 plan is architecturally well-structured — all 7 reviewers agree on this. However, validation against CODING-STANDARDS.md reveals the plan does not meet the project's own documented quality bar:

1. **3 CRITICAL standards violations** unique to this review: no testing strategy (the standard devotes 10 lines to explicit testing requirements), no error handling pattern (the standard shows GOOD/BAD examples), and no `prisma.$transaction` for checkout (the standard explicitly requires it for multi-table writes).

2. **7 CRITICAL issues confirmed across all reviews**: middleware Edge runtime incompatibility, CateringInquiry schema bug, webhook signature verification, server-side price verification, admin route auth, price Float anti-pattern, cart localStorage-only. The Maker synthesis confirmed all 7 as consensus findings.

3. **The plan omits entire sections of the standard**: Testing (§Testing Rules), Error Handling (§Error Handling), Component Structure (§Component Structure), Forms/Server Actions (§Forms). These aren't minor omissions — they are entire sections of the coding standards document with zero coverage in the plan.

4. **15 total standards violations** (Section 1) + **7 missing conventions** (Section 2) = 22 gaps between the plan and CODING-STANDARDS.md. A PASS would require fewer than 3 CRITICAL items and a documented plan to address all others. The plan currently has 10+ CRITICAL/HIGH items with no revision plan.

5. **Council protocol deviations**: 4 of 8 protocol steps are not satisfied. The plan's gate table omits Maker (Seat 4) from all phases, omits OpenCode from Phase 4, and has no evidence-gathering mechanism. These are structural process gaps.

### What Would Make This a PASS

A revised plan that:
- Adds a testing strategy section (Playwright + Vitest per standard)
- Specifies error handling conventions (try/catch → `{ success, error }` pattern)
- Includes `prisma.$transaction` in the checkout flow specification
- Specifies parallel data fetching (`Promise.all`) for independent queries
- Adds component structure rules and file-per-component mandate
- Adds `loading.tsx` and `error.tsx` to the route file tree
- Resolves the 7 consensus critical items from Maker synthesis
- Fixes the council gate table (add Maker to all phases, OpenCode to Phase 4)
- Adds an evidence-gathering step per phase

---

## SECTION 9: POSITIVE FINDINGS (What the Plan Gets Right)

Despite the FAIL verdict, these deserve explicit recognition:

1. **Tenant-first architecture from day one** — the static site's single-tenancy limitation is addressed as the foundation.
2. **Middleware tenant resolution** — pragmatic chain (hostname → path prefix → 404) covers dev, staging, and production.
3. **Soft deletes on Product** — matches CODING-STANDARDS.md and shows awareness of data safety.
4. **Success metrics are specific and measurable** — "0 Stripe keys in client bundles", "Two tenants side-by-side", "59 products importable".
5. **Stripe risk is #1 listed risk** — shows institutional learning from the static site's embedded key.
6. **Council review gates per phase** — the plan doesn't assume any single agent gets it right.
7. **Persona concurrence table** — explicitly maps features to Dienaba, Aminata, Tevin, and Visitor.
8. **Phased approach** — 6 phases over 11 days with clear gating is pragmatic and reviewable.
9. **Separation of store/admin** — `(store)/` and `(admin)/` route groups with separate layouts is the correct Next.js 15 pattern.
10. **Prisma singleton** — `lib/db.ts` listed explicitly, matching the standard's requirement.

---

## SECTION 10: METRICS SUMMARY

| Category | Count |
|---|---|
| Standards violations (Section 1) | **15** (3 🔴, 4 🟠, 5 🟡, 3 🟢) |
| Missing conventions (Section 2) | **7** (2 🔴, 3 🟠, 2 🟡) |
| Prisma query defects (Section 3) | **6** (2 🔴, 2 🟠, 2 🟡) |
| React anti-patterns (Section 4) | **4** (1 🔴, 2 🟠, 1 🟡) |
| Tenant scoping gaps (Section 5) | **5** (2 🔴, 2 🟠, 1 🟡) |
| Council protocol deviations (Section 6) | **4** FAIL |
| Unique findings (vs prior reviews) | **13** |
| Consensus CRITICAL items (all seats) | **7** |
| **Total issues identified** | **37+** |

---

**Signed,**
SWARM KANG — OpenCode Validator Mode
Seat 2, Council of Kangs V6
Validation: **FAIL** — Plan requires revision before Phase 1 implementation.

**Next:** Return to Prime Kang (Hermes) for plan revision incorporating findings from Thinker, Adversary, Archivist, Maker, and Swarm validations. Re-validate after revision.
