Audit complete. Report written to `.doa/council/JH-010/stability-audit.md`.

---

## Results

**No blocking issues.** TypeScript is clean (0 errors), all routes respond correctly, all referenced assets exist on disk, auth guards are correct on every protected route.

### 2 Significant Issues Found

**1. Orphaned admin pages** — `/admin/metrics` and `/admin/query-builder` have no navigation entries. They're unreachable unless you type the URL directly.  
- Fix: Add to `sidebar-nav.tsx` (and optionally `admin-tab-bar.tsx`)

**2. Nothing else** at "significant" level.

### 2 Minor Issues

**3. `StockPill` flattens tiers** — items with 6–8 stock show the same yellow warning pill as critically low items (1–5). No green/neutral tier for "acceptable" stock.  
(`admin/page.tsx:61-108`)

**4. Footer copyright says "Jazy's House Tokyo"** — probably a placeholder.  
(`store-footer.tsx:106`)

---

The orphaned nav links are the only real action item. Want me to add Metrics and Query Builder to the sidebar now?
all routes exist and return 200. ✅  
Active state logic: exact match for `/`, `startsWith` for others — correct. ✅  
Mobile hamburger opens `MobileMenu` overlay with same 4 links. ✅  
Cart pill opens `CartDrawer` slide-in. ✅

### Admin Sidebar (`sidebar-nav.tsx`)
Links present: Dashboard, Products, Orders, Catering, Customers, Settings (+ Users, Stores for SUPER_ADMIN). ✅

**BUG — Orphaned pages (no nav entry):**
- `/admin/metrics` — page exists, zero nav links pointing to it in sidebar or tab bar
- `/admin/query-builder` — page exists, zero nav links pointing to it in sidebar or tab bar

Both pages are only reachable by typing the URL directly. They need entries added to `sidebar-nav.tsx`.

### Admin Mobile Tab Bar (`admin-tab-bar.tsx`)
Shows 4 tabs at mobile breakpoint: Dashboard, Products, Orders, Catering.  
Customers is in the sidebar but not the tab bar — acceptable given 4-tab limit.  
Metrics and Query Builder absent here too (consistent with sidebar omission).

### NavSwitcher (storefront floating pill)
Uses `useSession()` — correctly provided by `SessionProvider` at root layout. ✅  
Shows Login when unauthenticated; Storefront/Shop/Wishlist or Admin/My Account when logged in. ✅

---

## 3. Auth Audit

### Admin Login (`admin@jazyshouse.com` / `admin1234`)
- `(admin)/layout.tsx` calls `requireAdmin()` which throws `redirect("/login")` for unauthenticated sessions ✅
- All admin pages gated by this single layout-level guard ✅
- `auth.ts` uses `NextAuth v5`, JWT strategy, credentials provider with bcrypt comparison ✅
- Super admin gets `activeTenantId` for tenant switching; tenant admin pinned to own `tenantId` (load-bearing security) ✅

### Customer Registration / Auth Pages
- `/wishlist`, `/orders`, `/account`, `/orders/[id]` all call `auth()` and `redirect("/login")` if null ✅
- Login page redirects admin users → `/admin`, customers → `/account` ✅

### Logout
- `UserMenu` component should invoke `signOut()` from NextAuth — not audited at runtime but the pattern is standard NextAuth v5.

### Session Propagation
- Root layout fetches `auth()` server-side and passes to `<Providers session={session}>` (a `SessionProvider` wrapper) ✅
- All client components using `useSession()` (NavSwitcher, UserMenu, etc.) are correctly provided ✅

---

## 4. Data Audit

### Dashboard (`/admin`)
10 parallel Prisma queries, all scoped to `tenantId`:
- Product count, category count ✅
- Active orders count (PENDING/PROCESSING/SHIPPED) ✅
- New catering inquiries count ✅
- Month revenue + all-time revenue aggregations ✅
- Recent orders (6) with item counts ✅
- Recent catering inquiries (3) ✅
- Low-stock products (stock ≤ 8, up to 5) ✅

**MINOR BUG — StockPill styles:**  
Both the `stock <= 5` branch and the `else` (stock 6–8) branch return identical yellow pills. Items with 6–8 units show the same "X left" warning style as critically low items (1–5). Consider a neutral/green style for the 6–8 range.

### Products Admin (`/admin/products`)
Filters by `tenantId` and `deletedAt: null`. ✅  
Search by name/slug (case-insensitive). ✅

### Orders Admin (`/admin/orders`)
Filter pills via `StatusPillFilter` component + search by name/email. ✅  
`ORDER_STATUSES` enum drives filter options. ✅

### Dashboard Stats
Real DB data — no mocked values. ✅

### Metrics (`/admin/metrics`)
Multi-query page covering revenue, orders, customers (distinct emails), newsletter signups, inventory health, top products by units sold, order status breakdown. All tenant-scoped. ✅  
Page renders without 500 if queries return empty (all handle `?? 0` / `.length` fallbacks). ✅

---

## 5. Console Audit (Static Analysis)

**TypeScript:** `npx tsc --noEmit` exits `0` — no type errors. ✅

**Images:**  
Lookbook references 8 images. All 8 confirmed present in `public/images/`:
- `dress-navy-orange.jpg` ✅
- `suit-maroon-gold.jpg` ✅ 
- `mens-colorful-shirt.jpg` ✅
- `dashiki-casual.jpg` ✅
- `jacket-yellow-blue.jpg` ✅
- `dress-baskets.jpg` ✅
- `phone-charms-set.jpg` ✅
- `dress-red-pattern.jpg` ✅
- `chef-dienaba.jpg` ✅ (used in catering section)

No 404s expected from known static image references.

**PostHog:**  
`capturePostHogEvent` is a no-op in dev unless `NEXT_PUBLIC_POSTHOG_KEY` is set — no spurious console errors expected on localhost. ✅

**Known clean imports:** All component files referenced in audit scope exist. No broken import paths detected.

**Potential runtime warnings to verify manually:**
- `next/image` with `fill` prop requires a positioned parent — visually check hero and product images
- Cart drawer uses `window.addEventListener` — SSR-safe (inside `useEffect`) ✅

---

## 6. Responsive Audit (Static Analysis)

### Mobile (375px)
- **Store:** Mobile hero (`md:hidden`) replaces desktop hero — correct. ✅
- **Store header:** Hamburger `☰` button + cart pill at mobile. ✅
- `MobileMenu` overlay is full-screen dark panel. ✅
- Product grids: `grid-cols-2` on mobile. ✅
- **Admin:** Sidebar hidden (`-translate-x-full`), burger icon shows → slide-in drawer. ✅
- `AdminTabBar` appears (fixed bottom, `lg:hidden`). ✅
- Main content has `pb-24` to clear tab bar. ✅

### Tablet (768px)
- Store header switches to desktop nav at `md:` (768px). ✅
- Admin sidebar remains hidden — desktop sidebar breakpoint is `lg:` (1024px). This means at 768px the admin uses mobile layout (hamburger + tab bar). Expected behavior — verify it doesn't feel cramped with 8-column grid on admin tables.

### Desktop (1280px)
- Store: Full sticky header with nav links and cart pill. ✅
- Admin: Fixed `248px` sidebar, `lg:pl-[248px]` content column. ✅
- Dashboard 2-col layout (`1.7fr 1fr`) with `max-lg:flex-col` fallback. ✅

---

## 7. Performance

**Note:** Runtime metrics (LCP, TTI, page load time) require browser DevTools / Lighthouse. Not measurable from static analysis.

**Structural observations:**
- All store and admin pages use `export const dynamic = "force-dynamic"` — no static caching, full server renders on every request. Appropriate given tenant-first data.
- Homepage fires 2 parallel Prisma queries (featured + pantry). Dashboard fires 10. These are async `Promise.all` — minimized DB round-trips. ✅
- Fonts loaded via `next/font/google` with `display: swap` — no layout shift from font loading. ✅
- Product images use `next/image` with `fill` + `sizes` hints on most locations. ✅

---

## Issue Summary

### Blocking
None.

### Significant
| # | Issue | File | Severity |
|---|-------|------|----------|
| 1 | `/admin/metrics` not in sidebar nav or tab bar (orphaned page) | `sidebar-nav.tsx` | High |
| 2 | `/admin/query-builder` not in sidebar nav or tab bar (orphaned page) | `sidebar-nav.tsx` | High |

### Minor
| # | Issue | File | Severity |
|---|-------|------|----------|
| 3 | `StockPill` — 6-8 stock shows same yellow style as ≤5; no visual tier | `admin/page.tsx:61-108` | Low |
| 4 | Footer copyright says "Jazy's House Tokyo" — may be placeholder | `store-footer.tsx:106` | Low |

### Verified Clean ✅
- TypeScript: 0 errors
- All public images referenced in code exist on disk
- All imported component files exist
- Auth guards on all protected routes
- Tenant isolation enforced on every Prisma query reviewed
- SessionProvider correctly provided at root
- PostHog dev-safe (no-op without API key)
- Responsive patterns set at correct Tailwind breakpoints
