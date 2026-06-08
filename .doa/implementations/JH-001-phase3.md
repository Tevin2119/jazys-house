# JH-001 Phase 3 — Storefront (Port from Static Site)

**Date:** 2026-06-07
**Status:** Implemented · build green · `tsc --noEmit` clean · `prisma validate` OK
**Reference:** static site at `C:\Users\Tevin\jazyshouse\` (design only — not copied)

## Summary

Ported the full customer-facing storefront from the static HTML/CSS site into
the Next.js App Router `(store)` route group. All catalog content is served from
the tenant-scoped database; nothing is hardcoded except catering packages (which
are service offerings, not inventory). Every page is `force-dynamic` and resolves
its tenant from the request host via `getCurrentTenant()`.

## Routes added

| Route | File | Notes |
|---|---|---|
| `/` | `(store)/page.tsx` | Hero, benefits, featured (badged products), catering teaser, pantry highlight, lookbook |
| `/shop` | `(store)/shop/page.tsx` | DB grid, category tabs (Links), server-side search (`?q=`), category filter (`?cat=`), empty state |
| `/shop/[slug]` | `(store)/shop/[slug]/page.tsx` | Gallery, breadcrumb, stock status, add-to-cart, related products, `notFound()` on miss/soft-delete |
| `/catering` | `(store)/catering/page.tsx` | 6 hardcoded packages, chef section, how-it-works, inquiry form |
| `/about` | `(store)/about/page.tsx` | Brand story, values, chef profile |
| `/cart` | `(store)/cart/page.tsx` | Client cart from localStorage, qty controls, summary |
| `/checkout` | `(store)/checkout/page.tsx` | Shipping form + order summary → `placeOrder` action |
| `/checkout/confirmation` | `(store)/checkout/confirmation/page.tsx` | Order summary (tenant-scoped lookup), clears client cart |
| `/sitemap.xml` | `app/sitemap.ts` | Dynamic, tenant-scoped (static pages + live products) |
| `/manifest.webmanifest` | `app/manifest.ts` | PWA manifest, icons from `/public/images` |

## Shared infrastructure

- **`lib/cart.ts`** — framework-free, SSR-safe localStorage cart (`getCart`,
  `addItem`, `removeItem`, `updateQty`, `clearCart`, `cartCount`, `cartSubtotal`).
  Item shape `{ productId, name, price, quantity, image, emoji }`. Emits a
  `jazyshouse:cart` window event so the nav badge stays in sync.
- **`lib/storefront.ts`** — `server-only` tenant-scoped queries (`getCategories`,
  `getFeaturedProducts`, `getCatalog`, `getProductBySlug`, `getRelatedProducts`).
  All filter `tenantId` + `deletedAt: null`.
- **`lib/catering-packages.ts`** — the 6 catering offerings (shared by home + catering page).
- **Components** under `components/store/`: `store-header` (client, mobile menu +
  cart badge), `store-footer` (server + newsletter), `product-card`, `product-image`
  (next/image + emoji fallback), `product-gallery`, `product-badge`,
  `add-to-cart-button`, `cart-badge`, `cart-view`, `checkout-form`, `newsletter-form`,
  `catering-form`, `clear-cart`, `section`, `no-store`.
- **Server actions**: `(store)/catering/actions.ts` (`submitCateringInquiry`),
  `(store)/actions.ts` (`subscribeNewsletter`), `(store)/checkout/actions.ts` (`placeOrder`).
- **`(store)/layout.tsx`** — now wraps pages in header/footer + injects tenant theme vars.

## Schema change

Added **`NewsletterSignup`** model (tenant-scoped, `@@unique([tenantId, email])`)
for the footer newsletter, plus the `Tenant.newsletterSignups` relation.
`prisma validate` passes and the client was regenerated. **A migration is still
required** (see Pending below).

## Security / tenancy (council constraints honored)

- **C1** — `getCatalog` resolves a client-supplied category **by slug within the
  tenant** (`tenant_slug` unique). An unknown/crafted slug returns `[]`, never
  another store's products. URL `categoryId` is never trusted.
- **C2** — `placeOrder` re-prices the cart server-side via `verifyCart` (client
  prices ignored), then creates `Order` + `OrderItem`s in one transaction with
  `tenantId` set on **every** OrderItem.
- Tenant always resolved server-side from the host; never from client input.
- No Prisma in client components — data fetched in server components, passed as props.
- Confirmation page scopes the order lookup by `tenantId`.

## Notes / deviations

- Static site cleared a "cart cookie"; our cart is localStorage, so the
  confirmation page clears it client-side (`ClearCart`) after the order is persisted.
- Copied the static site's `images/` (63 files, incl. icons + logo) into
  `public/images/` so DB image paths (`images/x.jpg`) and page imagery resolve.
  `ProductImage` normalizes paths to a leading `/`.
- Newsletter signups create `NewsletterSignup` rows (chose a dedicated model over
  overloading `CateringInquiry`).

## Verification

- ✅ `npx tsc --noEmit` — clean
- ✅ `npm run build` — green; all 10 storefront routes + sitemap + manifest emit as `ƒ` (dynamic)
- ✅ `npx prisma validate` — schema valid; client regenerated
- ✅ **tenancy-guardian review** — PASS, no cross-tenant leaks; C1 + C2 confirmed
- ✅ **storefront-reviewer review** — PASS; fixed confirmed fidelity misses:
  product cards `aspect-[3/4]` (was square), dark footer `#2c1810`/light text (was cream)
- ⛔ **Runtime not verified** — `DATABASE_URL` is still the Supabase placeholder
  (`PROJECT_REF`) and there are no migrations, so routes can't be loaded against
  real data. Same blocker as Phase 2.

## Pending (next session)

1. Bring up a real Postgres (`DATABASE_URL`/`DIRECT_URL`).
2. `npx prisma migrate dev` — creates the **first** migration, capturing Phase 2's
   `User.passwordHash` **and** Phase 3's `NewsletterSignup`.
3. `npm run db:seed` — catalog + admin logins.
4. Then verify: route loads, category filter/search, add-to-cart → cart → checkout →
   confirmation end-to-end.
