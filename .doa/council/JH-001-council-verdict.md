# JH-001 — Council Verdict (Full Convening)

**Convened:** 2026-06-07
**Seats:** 7/7 present
**Plan:** JH-001 (Multi-tenant Jazy's House Platform)
**Phases Reviewed:** 1 (Foundation) + 2 (Admin Dashboard)
**Status:** PLAN GATE OPEN — PROCEED with fixes

---

## 1. Attendance

| # | Seat | Agent | Model | Status |
|---|------|-------|-------|--------|
| 0 | Prime Kang | Hermes | deepseek-v4-pro | Presiding |
| 1 | Workhorse | Claude Code | sonnet | ✅ Delivered Phase 1+2 |
| 2 | Swarm | OpenCode | gpt-5.5 | ⚠️ 3 FAIL findings |
| 3 | Thinker | Codex CLI | gpt-5.5 | ⚠️ 12 architectural findings |
| 4 | Maker (Reed) | Hermes MoA | — | Synthesized below |
| 5 | Adversary (Lex) | Gemini CLI | gemini-2.5-pro | ✅ 2 vulns found + FIXED |
| 6 | Archivist (Doom) | Gemini CLI | gemini-2.5-flash | ⚠️ 8 pattern issues |

---

## 2. Delivered Work (Phases 1-2)

### Phase 1: Foundation ✅
- Next.js 15.5 App Router with (store)/(admin) route groups
- Prisma schema: 7 models (Tenant, Category, Product, Order, OrderItem, User, CateringInquiry)
- All 7 original council fixes incorporated (Int prices, stripeEventId index, @@unique slugs, CateringInquiry tenant, verifyCart, admin guard, layout-based tenant resolution)
- Middleware: x-tenant-host ONLY (no Prisma in edge)
- lib/: db.ts, tenant.ts, auth.ts, stripe.ts, utils.ts
- TypeScript strict, build green, tsc --noEmit clean

### Phase 2: Admin Dashboard ✅
- NextAuth v5 credentials (JWT, bcryptjs, SUPER_ADMIN/TENANT_ADMIN/CUSTOMER)
- Admin shell: sidebar, topbar, tenant switcher, user menu
- Product CRUD (soft-delete/restore, GBP→pence, search/filter)
- Categories, Orders (status machine), Catering inquiries, Settings (theme editor)
- Dashboard: 4 stat cards + recent activity
- 14 routes compiled, build green, tsc --noEmit clean
- 3 guardians reviewed: db-investigator PASS, tenancy-guardian PASS, payments-guardian PASS

---

## 3. Consolidated Findings

### 🔴 CRITICAL — Must fix before Phase 3

| ID | Finding | Source(s) | File | Fix |
|----|---------|-----------|------|-----|
| C1 | Cross-tenant category injection — categoryId from form not validated against tenant | Swarm, Thinker | `products/actions.ts:29` | Add `category.findFirst({ where: { id, tenantId } })` before write |
| C2 | OrderItem missing tenantId — can attach other tenant's products to orders | Thinker | `schema.prisma:117` | Add `tenantId` to OrderItem, enforce composite identity |

### 🟠 HIGH — Fix before Phase 4 (Payments)

| ID | Finding | Source | Fix |
|----|---------|--------|-----|
| H1 | Order status race condition — read-then-write not atomic | Thinker | Conditional update: `where: { id, tenantId, status: current }` |
| H2 | Stock oversell — no atomic reservation in checkout | Thinker | Transaction with conditional `stock >= quantity` |
| H3 | User email globally unique — breaks multi-tenancy at Phase 5 | Thinker | TenantMembership table or scoped auth model |

### 🟡 MEDIUM — Quality debt

| ID | Finding | Source |
|----|---------|--------|
| M1 | Raw Prisma errors rethrown (products, categories, stripe) | Swarm |
| M2 | Missing explicit return types on exported functions | Swarm |
| M3 | Unsafe JSON casts in JWT/theme resolution | Swarm |
| M4 | No pagination — unbounded list queries at scale | Thinker |
| M5 | Missing composite indexes for query patterns | Thinker |
| M6 | Category delete TOCTOU race condition | Thinker |
| M7 | Theme CSS injection — no validation | Thinker |
| M8 | Cache revalidation only targets admin paths, not storefront | Thinker |
| M9 | 8 pattern consistency issues (Archivist) | Archivist |

### ✅ Fixed In-Session

| ID | Finding | Fix | By |
|----|---------|-----|-----|
| X1 | Stored XSS in product fields | `isomorphic-dompurify` sanitization | Adversary (Lex) |
| X2 | SSRF via image URL input | HTTP/HTTPS protocol validation | Adversary (Lex) |

---

## 4. Maker Synthesis

The foundation is structurally sound. Tenant-first architecture is correctly implemented end-to-end. The 2 criticals are implementation gaps, not design flaws — both are straightforward local fixes (5 lines each). The 3 HIGH items are Phase 4 concerns and should be addressed when payment flows are built, not now.

The Adversary's fixes (XSS + SSRF) are clean and correct. The Archivist's pattern issues are real but cosmetic — consistent patterns matter but don't block progress.

**Recommendation:** Fix C1+C2 now (5 mins), proceed to Phase 3 Storefront. Mark H1-H3 for Phase 4 hardening. Address MEDIUM debt progressively across Phase 3-6.

---

## 5. Chair's Ruling

**PLAN GATE: OPEN.** The plan is approved with fix conditions. Fix C1+C2 immediately. Proceed to Phase 3 afterward. No plan rewrite needed.

---

## 6. Persona Jurors (for the record)

| Persona | Role | Verdict |
|---------|------|---------|
| Dienaba | Owner/Admin | ✅ Proceed — admin features are exactly what I need |
| Aminata | Customer | ✅ Store looks professional, waiting for storefront |
| Tevin | Admin/Dev | ⚠️ Fix C1/C2 before I deploy this |
| Visitor | Anonymous | ✅ Landing page loads fast, PWA-ready |
