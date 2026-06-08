# JH-001 Phase 5 — Multi-Storefront (Domain Routing + Themes)

**Status:** ✅ Implemented · `npm run build` green · `npx tsc --noEmit` clean · `prisma validate` ✓
**Date:** 2026-06-07

Production multi-tenant infrastructure: robust host/path tenant resolution, a
SUPER_ADMIN tenant CRUD, theme validation + live preview + logos, a 3-tenant
demo seed, an isolation audit (two guardians), and dev-experience polish.

---

## Files changed

| File | Change |
|---|---|
| `src/lib/host.ts` | **New.** Pure host parsing (`normalizeHost`, `stripWww`, `subdomainFromHost`) — no `server-only`/Prisma, so it is unit-testable |
| `src/lib/tenant.ts` | Rewritten resolution: `x-tenant-slug` path header → custom domain → subdomain → **root-domain default fallback** (`getDefaultTenant`). www-strip, port-strip, case-insensitive slugs |
| `src/middleware.ts` | Adds `/store/<slug>/…` → `/…` rewrite with `x-tenant-slug` header (path-based dev routing) |
| `src/lib/theme.ts` | **New.** `assertValidTheme` (strict, on save), `resolveTheme` (lenient, on render), `isHexColor`/`isLogoUrl`, `DEFAULT_THEME`, `FONT_OPTIONS`, `themeToCssVars` |
| `src/lib/tenant-defaults.ts` | **New.** `DEFAULT_CATEGORIES` shared by seed + create-tenant action |
| `src/app/(admin)/admin/tenants/{page,new/page,[id]/edit/page}.tsx` | **New.** SUPER_ADMIN tenant list / create / edit |
| `src/app/(admin)/admin/tenants/actions.ts` | **New.** `createTenant` (atomic tenant+categories+owner), `updateTenant`, `deleteTenant` (orders-block + cascade, error-hardened) |
| `src/components/admin/tenant-form.tsx` | **New.** Create/edit form (`useActionState`, inline error) |
| `src/components/admin/theme-fields.tsx` | **New.** Reusable color/font/logo inputs + live preview |
| `src/components/admin/theme-editor.tsx` | Refactored to wrap `ThemeFields` |
| `src/app/(admin)/admin/settings/{actions,page}.tsx` | Validate theme via `assertValidTheme`; surface `logoUrl` |
| `src/components/admin/sidebar-nav.tsx` | "Stores" nav item (SUPER_ADMIN only) |
| `src/components/admin/admin-shell.tsx` + `src/app/(admin)/layout.tsx` | Active store logo/name in the shell |
| `src/app/(store)/layout.tsx` + `src/components/store/store-header.tsx` | `resolveTheme` → CSS vars; tenant name + logo in the header |
| `prisma/seed.ts` | Refactored to `seedTenant()`; seeds **jazyshouse / afrochic / baobab** with distinct themes + catalog subsets + owners |
| `__tests__/tenancy/*.test.ts` | **New.** Vitest stubs: resolution, theme validation, isolation (static + `.todo` integration) |
| `.env.example`, `scripts/dev-tenant.mjs`, `package.json`, `README.md`, `tsconfig.json` | `DEFAULT_TENANT_SLUG`, `npm run dev:jazyshouse`, tenant-setup docs, `__tests__` excluded from tsc |

---

## Task checklist

- **5a — Resolution:** ✅ Path `/store/<slug>` (middleware header), custom domain, subdomain, root→default (`DEFAULT_TENANT_SLUG` or oldest), `www.` strip, port strip, case-insensitive slugs. An *unknown* subdomain returns null (NoStore) — only the bare apex falls back to default, so the default store is never leaked.
- **5b — Tenant CRUD:** ✅ List/create/edit/delete, all gated by `requireSuperAdmin()`. Create provisions tenant + `DEFAULT_CATEGORIES` + first `TENANT_ADMIN` in one transaction. Delete blocks when orders exist (Order FK is `Restrict`) and otherwise removes users explicitly + cascades catalog rows. New tenant appears in the switcher + list immediately.
- **5c — Theme hardening:** ✅ Colors `^#[0-9a-fA-F]{6}$`, font allowlist, safe logo (relative path or http(s)); arbitrary tokens rejected on save, defaulted on render. `DEFAULT_THEME` fallback. Live preview in `ThemeFields`. Logo in store header + admin shell.
- **5d — Seed:** ✅ Three tenants, distinct themes (terracotta/cream, deep-green/gold, warm-brown/yellow), catalog subsets, per-tenant owner, idempotent upserts.
- **5e — Isolation audit:** ✅ `tenancy-guardian` + `db-investigator` reviewed (both PASS on the core model). Static + integration test stubs added. Fixes applied below.
- **5f — Dev experience:** ✅ `DEFAULT_TENANT_SLUG`, `npm run dev:jazyshouse` (cross-platform Node wrapper), README "Multi-tenant setup" paragraph.

---

## Hardening applied from the guardian audit

1. **`deleteTenant` error window closed** — the order-count and the delete are two round-trips; an order created in between would make the `Restrict` FK throw a raw 500. Now wrapped: `P2003` → re-shown as the orders-block message, `P2025` → already-gone (silent), else → generic delete error. The list page also disables delete when `orders > 0` (UI fence) *and* the action enforces it (server fence).

---

## Deviations / notes for the user

- **No schema migration.** Tenant delete is hard-delete-when-empty / blocked-when-orders, which the existing `Order`→`Tenant` `Restrict` FK already enforces — so no `deletedAt` column was added to `Tenant`. If you prefer soft-delete (retain the row, hide from resolution), that needs a schema field + migration; say the word.
- **Path-based routing is intentionally non-sticky.** `/store/<slug>` resolves that one request; storefront links are root-relative (`/shop`, `/cart`), so navigation drops the prefix. It's a dev/preview affordance, not a production routing mode (use subdomains/custom domains for that). `npm run dev:jazyshouse` is the smoother local path.
- **Logos use `<img>`, not `next/image`.** Tenant logo URLs are operator-supplied and not statically whitelistable in `next.config.ts`; `next/image` would reject unknown hosts. Validated to relative-path or http(s) only. To get optimization, restrict logos to Vercel Blob (already whitelisted) and switch back to `next/image`.
- **Vitest not installed.** `__tests__/tenancy/` targets the documented runner (`npx vitest`); `npm i -D vitest` to run. They're excluded from `tsc` so the typecheck stays clean.

## Known follow-ups (not blocking)

- **Phantom `activeTenantId` (guardian, medium).** A SUPER_ADMIN's `update({ activeTenantId })` is stored without verifying the tenant exists, and deleting the currently-active store leaves the JWT pointing at a gone tenant → admin queries silently scope to nothing (no cross-tenant leak). Fix: validate `activeTenantId` against the DB in the `auth.ts` update trigger, and/or redirect to `/admin/select-tenant` from `getAdminContext` when it no longer resolves. Deferred to avoid expanding into Phase 2 auth internals + a hot-path query this phase.
- **`getProductBySlug` could be `findUnique`** on `(tenantId, slug)` (currently `findFirst`) — marginal efficiency, no correctness impact.
- Multi-label non-root hosts (`a.b.example.com`) extract `a` as a slug → a harmless miss query (no leak). Left as intentional staging-host convenience.

## Verification

```
npx prisma validate   # ✓ schema valid
npx tsc --noEmit      # ✓ clean (__tests__ excluded; run via npx vitest)
npm run build         # ✓ /admin/tenants, /admin/tenants/new, /admin/tenants/[id]/edit registered; middleware 34.3 kB
```
