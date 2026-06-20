Build passed cleanly. All routes are present: `/account`, `/orders`, `/orders/[id]`, `/wishlist`.

**Docs consulted:** `prisma/schema.prisma`, `src/auth.ts`, `src/types/next-auth.d.ts`, `src/app/(store)/layout.tsx`, `src/components/store/product-card.tsx`

---

JH-008 is complete. Here's what shipped:

**FIX 1 — Floating Nav Bar**
- `src/components/store/nav-switcher.tsx` — dark pill bar fixed to bottom, login-aware via `useSession()`. Logged out → Login; Customer → Storefront / Shop / Wishlist ♡ / My Account; Admin → Storefront / Shop / Admin / My Account.
- `src/app/providers.tsx` — `SessionProvider` wrapper; session pre-populated server-side to prevent auth flash.
- Root layout made `async` and wraps everything in `<Providers>`.

**FIX 2 — Wishlist**
- `WishlistItem` model added to schema and pushed to DB.
- `src/lib/wishlist-actions.ts` — `toggleWishlist()` server action.
- `src/components/store/wishlist-button.tsx` — heart icon on product cards (CUSTOMER-only, button is a sibling of the link, not nested inside it).
- `src/app/(store)/wishlist/page.tsx` — saved items grid.

**FIX 3 — Order History**
- `src/app/(store)/orders/page.tsx` — order list filtered by email.
- `src/app/(store)/orders/[id]/page.tsx` — order detail with items, status, address.

**FIX 4 — Account Page**
- `src/app/(store)/account/page.tsx` — name, email, order count, total spent, wishlist count, links.

**Login flow** — `login/actions.ts` pre-checks role before `signIn()` so admins still land on `/admin` and customers go to `/account`. Dev server was stopped to unlock the Prisma DLL for client regeneration — you'll need to restart it with `npm run dev`.
ntId + email`.
- **`src/app/(store)/orders/[id]/page.tsx`** — Order detail with items, status, total, address. Guards cross-customer access by matching email to session.

### FIX 4 — My Account Page
- **`src/app/(store)/account/page.tsx`** — Name, email, order count, total spent, wishlist count. Links to orders and wishlist.

### Login flow
- **`src/app/login/actions.ts`** — Pre-checks role before `signIn()`; admins land on `/admin`, customers on `/account`.
- **`src/app/login/page.tsx`** — Role-aware redirect for already-authenticated users; subtitle updated.

## DB
- `prisma db push` succeeded — WishlistItem table created.

## Files changed
| File | Change |
|------|--------|
| `prisma/schema.prisma` | +WishlistItem model, back-relations |
| `src/app/layout.tsx` | +Providers wrapper |
| `src/app/providers.tsx` | NEW |
| `src/app/(store)/layout.tsx` | +NavSwitcher, +pb-24 |
| `src/app/(store)/wishlist/page.tsx` | NEW |
| `src/app/(store)/orders/page.tsx` | NEW |
| `src/app/(store)/orders/[id]/page.tsx` | NEW |
| `src/app/(store)/account/page.tsx` | NEW |
| `src/components/store/nav-switcher.tsx` | NEW |
| `src/components/store/wishlist-button.tsx` | NEW |
| `src/lib/wishlist-actions.ts` | NEW |
| `src/app/login/actions.ts` | Role-aware redirect |
| `src/app/login/page.tsx` | Role-aware redirect |
| `src/components/store/product-card.tsx` | +WishlistButton |
