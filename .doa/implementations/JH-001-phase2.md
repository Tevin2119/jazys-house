# JH-001 Phase 2 — Admin Dashboard

**Status:** Implemented & verified (typecheck + production build green). Runtime
smoke-test pending a reachable database (see *Operational follow-ups*).

Built on the Phase 1 foundation (App Router, Prisma 7-model schema, tenant-first
middleware/layout resolution, `lib/` stubs). NextAuth v5, real admin CRUD, and a
tenant-scoped data layer now replace the Phase 1 stubs.

---

## What was built

### 2a. NextAuth v5 (Auth.js) — credentials
- `src/auth.ts` — `NextAuth({...})` with the **Credentials** provider, **JWT**
  session strategy, `bcryptjs` password verification against `User.passwordHash`.
- `src/app/api/auth/[...nextauth]/route.ts` — GET/POST handlers.
- `src/types/next-auth.d.ts` — module augmentation: `role`, `tenantId`,
  `activeTenantId` on Session + JWT.
- `src/lib/auth.ts` — helper surface: `getSession`, `requireAdmin`,
  `requireSuperAdmin`, `redirectToLogin`, `canAccessTenant`, and the
  **`getAdminContext()`** tenant-scoping helper every admin page/action uses.
- `src/app/login/` (`page.tsx`, `actions.ts`) + `src/components/auth/login-form.tsx`
  — credentials login form (`useActionState`), generic error messaging.
- `src/lib/auth-actions.ts` — `signOutAction`.
- **Schema:** added `passwordHash String?` to `User`.
- **Seed:** `prisma/seed.ts` now upserts two admins —
  `admin@jazyshouse.com` (SUPER_ADMIN) and `owner@jazyshouse.com` (TENANT_ADMIN),
  password from `SEED_ADMIN_PASSWORD` (dev default `admin1234`).

### 2b. Tenant switcher
- `src/components/admin/tenant-switcher.tsx` — SUPER_ADMIN-only dropdown.
  Persists the choice into the JWT via `useSession().update({ activeTenantId })`,
  then `router.refresh()` re-runs every tenant-scoped server query.
- `src/components/admin/tenant-chooser.tsx` + `/admin/select-tenant` — full-page
  picker for a super admin with no active store selected.
- **Security:** in `src/auth.ts` the JWT `update` trigger only mutates
  `activeTenantId` when `token.role === "SUPER_ADMIN"`. A TENANT_ADMIN is pinned
  to `user.tenantId` and is structurally unable to switch scope.

### 2c. Admin shell
- `src/app/(admin)/layout.tsx` — `requireAdmin()` guard (single source of truth
  for the whole route group), fetches the tenant list, wraps children in
  `SessionProvider` + `AdminShell`.
- `src/components/admin/admin-shell.tsx` — collapsible sidebar (mobile drawer +
  backdrop), sticky topbar, switcher / store badge / active indicator, user menu.
- `src/components/admin/sidebar-nav.tsx` (active-route highlighting),
  `user-menu.tsx` (avatar + logout), `providers/session-provider.tsx`.

### 2d. Products (CRUD)
- `/admin/products` — server-rendered table; URL-param search (name), category
  filter, status filter (active / deleted; default active).
- `/admin/products/new`, `/admin/products/[id]/edit` — shared `product-form.tsx`
  (GBP→pence conversion, category Select, newline-separated image URLs, stock,
  badge, emoji).
- `actions.ts` — create / update / **soft-delete** (`deletedAt`) / restore. All
  writes use `updateMany({ where: { id, tenantId } })`. Edit page loads via
  `findFirst({ where: { id, tenantId } })` → `notFound()`.

### 2e. Categories
- `/admin/categories` — list with product counts, create/edit via Dialog,
  delete **guarded** (blocked when the category still has products).

### 2f. Orders
- `/admin/orders` — table; status filter + search by email/name.
- `/admin/orders/[id]` — items, customer, defensive address renderer, totals,
  status changer.
- `src/lib/order-status.ts` — `allowedNextStatuses()` single source of truth.
  Transitions PENDING→PROCESSING→SHIPPED→DELIVERED, any non-terminal →CANCELLED;
  DELIVERED/CANCELLED terminal. **Validated server-side** (illegal transitions
  rejected), with a two-step tenant fence before the write.

### 2g. Catering
- `/admin/catering` — table + per-row status Select (new → contacted → booked →
  declined), server-validated, tenant-scoped.

### 2h. Settings
- `/admin/settings` — read-only store details (slug / domain / currency) + a
  branding editor (primary/secondary color pickers, font select) persisted to
  `tenant.theme` JSON.

### 2i. Dashboard home
- `/admin` — 4 stat cards (active products, active orders, new inquiries,
  delivered-order revenue), recent orders (5), recent inquiries (5). All queries
  parallelized and tenant-scoped.

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ clean |
| `npm run build` | ✅ 14 routes; all `/admin/*` server-rendered on demand (ƒ) |
| No Prisma in client components | ✅ grep: none of the 21 `"use client"` files import `@/lib/db` |
| Every data fetch tenant-scoped | ✅ confirmed (tenancy-guardian review) |
| Auth guards on all admin routes | ✅ `(admin)/layout.tsx` → `requireAdmin()` |
| Tenant-isolation review | ✅ **PASS — 0 critical**; 2 robustness warnings, both hardened |

**Tenancy-guardian hardening applied:** added `requireSuperAdmin()` and used it
in `/admin/select-tenant` so the role check precedes any tenant query; the
settings `update({ where: { id: tenantId } })` is documented as safe (the
`Tenant` PK *is* the scope, derived from the session only).

---

## Operational follow-ups (DB was unreachable in this environment)

The `.env` `DATABASE_URL` points at a placeholder Supabase host, so migrations
could not be applied here. Before running the app:

1. Point `DATABASE_URL` / `DIRECT_URL` at a real Postgres instance.
2. `npx prisma migrate dev --name add_user_password_hash` (applies the new
   `User.passwordHash` column — `prisma generate` already ran for the build).
3. `npm run db:seed` (creates the catalog + the two admin logins above).
4. `npm run dev`, sign in at `/login`, smoke-test each `/admin/*` route.

`npm run build` succeeds without a DB because every admin route is
`force-dynamic` and never prerenders.

---

## Dependencies added
`next-auth@5.0.0-beta.x`, `bcryptjs@3`. shadcn/ui components added: table, input,
select, dialog, dropdown-menu, card, badge, label, textarea, avatar (unified
`radix-ui` package).
