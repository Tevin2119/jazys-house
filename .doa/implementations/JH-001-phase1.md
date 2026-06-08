# JH-001 — Phase 1 Implementation Summary (Foundation)

**Implemented:** 2026-06-07
**Phase:** 1 of 6 (Foundation)
**Status:** ✅ Complete — build green, schema valid, council guardians PASS

---

## 1. What was built

Scaffolded the multi-tenant Next.js platform foundation. **No storefront pages**
(Phase 3) or admin features (Phase 2) were built — only the structure, schema,
libs, tenant resolution, layout shells, and seed.

### Verification

| Check | Command | Result |
|-------|---------|--------|
| Dependencies install | `npm install` | ✅ exit 0 (185 pkgs) |
| Prisma schema | `npx prisma validate` | ✅ valid |
| Type check | `npx tsc --noEmit` | ✅ no errors |
| Production build | `npm run build` | ✅ compiled, 3 routes + middleware |

> Migrations + seed were **not executed** — `.env` holds a placeholder Supabase
> connection string. Provision a real DB, then `npm run db:migrate && npm run db:seed`.

---

## 2. Stack

- **Next.js 15.5** (App Router) + **React 19** + **TypeScript 5.7** (strict)
- **Tailwind CSS v4** (`@tailwindcss/postcss`) + **shadcn/ui** (new-york, `components.json`, `Button` primitive)
- **Prisma 6.19** + PostgreSQL (Supabase) — `DATABASE_URL` (pooled) + `DIRECT_URL` (migrations)
- **Stripe 17.5** (server-only)
- `tsx` for the seed runner

---

## 3. Project structure

```
package.json, tsconfig.json, next.config.ts, postcss.config.mjs, components.json
.env.example (template) · .env (gitignored, placeholders)
prisma/
  schema.prisma          # 7 models, all council fixes
  seed.ts                # 1 tenant, 6 categories, 53 products
src/
  middleware.ts          # thin host-extraction ONLY (no Prisma)
  lib/
    db.ts                # Prisma singleton
    tenant.ts            # LAYOUT-BASED resolution (server-only, React cache)
    auth.ts              # session/guard stub (Phase 2 NextAuth)
    stripe.ts            # server-only client + verifyCart() price stub
    utils.ts             # cn(), formatPrice(), toMinorUnits(), slugify()
  components/ui/button.tsx
  app/
    layout.tsx           # root html/body + Playfair/DM Sans fonts
    globals.css          # Tailwind v4 + brand tokens + tenant theme hooks
    (store)/layout.tsx   # resolves tenant, injects theme vars
    (store)/page.tsx     # storefront home placeholder
    (admin)/layout.tsx   # auth-guard shell
    (admin)/admin/page.tsx  # dashboard placeholder (/admin)
```

---

## 4. Council critical fixes — all incorporated

| Fix | Where | Status |
|-----|-------|--------|
| `price: Int` (pence), not Float | `Product.price`, `Order.total`, `OrderItem.price` | ✅ |
| `stripeEventId` on Order (webhook idempotency) | `schema.prisma` Order + `@@index([stripeEventId])` | ✅ |
| `@@unique([tenantId, slug])` on Product | `schema.prisma` Product | ✅ (added `slug` field — plan omitted it) |
| Tenant relation on CateringInquiry | `schema.prisma` CateringInquiry (`onDelete: Cascade`) | ✅ |
| Server-side price verification stub | `lib/stripe.ts` `verifyCart()` — re-reads price from DB, ignores client prices | ✅ |
| Admin layout with auth-guard stub | `(admin)/layout.tsx` + `lib/auth.ts` `requireAdmin()` | ✅ |
| Layout-based tenant resolution, NOT edge middleware | `middleware.ts` (header only) + `lib/tenant.ts` (Prisma in Node) | ✅ |

### Tenant resolution design (the key constraint)
- **Edge middleware can't run Prisma**, so `middleware.ts` does ZERO DB work — it
  only copies the request host into an `x-tenant-host` header.
- `lib/tenant.ts` (marked `import "server-only"`) does the Prisma lookup, called
  from the **store layout** (Node runtime), memoized per request via `React.cache`.
- Resolution order: custom domain → subdomain slug → explicit path slug.

---

## 5. Guardian review (council validation)

Ran 3 specialists post-implementation. All returned **PASS**:

- **db-investigator** — all 4 schema fixes confirmed; tenant-scoping complete;
  indexes present; seed idempotent; money is Int throughout.
- **tenancy-guardian** — middleware Prisma-free ✓; resolution in Node ✓; per-request
  memoization ✓; no cross-tenant leak (queries are exact-match on `@unique` cols).
- **payments-guardian** — secret key server-only ✓; no secrets in repo (placeholders
  only); `verifyCart` trust boundary correct; key separation correct.

### Hardening applied from review feedback
- Documented deliberate `Order→Tenant` `Restrict` (orders are financial records). `schema.prisma`
- Added `@@index([stripeEventId])` for Phase 4 webhook lookups. `schema.prisma`
- Guarded `www.`-prefix / multi-label subdomain edge case + documented 2-label
  custom-domain requirement. `lib/tenant.ts`

### Deferred to later phases (correctly NOT Phase 1 gaps)
- Stripe webhook signature verification → Phase 4.
- Real NextAuth wiring (`getSession`/`requireAdmin` are stubs) → Phase 2.
- Hard-fail on missing `STRIPE_SECRET_KEY` in production → Phase 4.
- Generic (non-leaky) error messages from `verifyCart` callers → Phase 4.

---

## 6. ⚠️ Catalog count discrepancy

The brief said "import 59 products," but the source of truth
(`C:\Users\Tevin\jazyshouse\js\main.js`) contains **53 products**:

| Category | Count |
|----------|------:|
| Women | 8 |
| Men | 6 |
| Kids | 6 |
| Accessories | 11 |
| Pantry/Superfoods | 9 |
| Home Décor | 13 |
| **Total** | **53** |

All 53 are transcribed verbatim into `prisma/seed.ts` (prices converted to pence,
emoji fallback + image paths preserved, slugs generated). **The "59" figure
appears to be incorrect** — please confirm whether 6 products are missing from the
static catalog or whether 53 is the true count.

> Image paths are stored as relative `images/*.jpg` from the static site. Phase 3/5
> must move these to a CDN/Blob and update `Product.images` accordingly.

---

## 7. Seed tenant

`Jazy's House Tokyo` — slug `jazyshouse`, domain `jazyshouse.com`, currency `gbp`,
theme `{ primary:#c0563d, secondary:#f0e6d3, font: DM Sans }` (from static-site CSS).

Dev access once seeded: `localhost:3000/` (host fallback), `jazyshouse.localhost:3000`,
or via the `domain` column for `jazyshouse.com`.

---

## 8. Next steps (Phase 2 — Admin Dashboard)

1. Provision Supabase DB, set real `DATABASE_URL`/`DIRECT_URL`, run `db:migrate` + `db:seed`.
2. Wire NextAuth/Auth.js into `lib/auth.ts` (`getSession`/`requireAdmin`), backed by `User`.
3. Tenant switcher, product CRUD, order management, catering inquiry management.
4. Every admin mutation must call `requireAdmin()` and scope Prisma queries by `tenantId`.
