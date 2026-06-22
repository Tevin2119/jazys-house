Pushed. Vercel will auto-deploy from `master`.

---

**JH-012 Batch 5 complete.** Here's what was delivered:

**5.2 Sidebar nav** — rewritten with 4 grouped sections: Insights (Dashboard, Metrics, Queries), Operations (Orders+badge, Products, Refunds), Customers (Customers, Messages+badge), Management (Employees, Integrations, Shipping, Catering, Settings). Super-admins get a Platform group. Live badge counts (pending orders, 7-day customer messages) fetched server-side in the layout and threaded through as props.

**5.3 Mobile tab bar** — new main tabs: Dashboard, Orders (badge), Messages (badge), Catering + **More** button. More opens a slide-up drawer with 9 overflow items in a 4-col grid. Backdrop overlay, tap-to-dismiss.

**Build: ✅ 0 errors.** All 8 new routes confirmed in build output.

**Gap status (gap-analysis.md):** 36 gaps closed, 9 partial, 24 remaining. Biggest remaining P0s are the order detail 4-tab layout (G-18) and KOMOJU integration (G-38/G-69–G-71).

Docs consulted: `CODING-STANDARDS.md`, `prisma/schema.prisma`, `gap-analysis.md`, Batch 4 implementation notes.
 order count fetched in layout, passed as `badgeCounts.pendingOrders`
- **Messages** — customer messages in the last 7 days as `badgeCounts.unreadMessages`

Badge pill: red background on inactive items, semi-transparent white on active item. Capped at "99+".

---

## 5.3 Mobile Tab Bar

**File:** `src/components/admin/admin-tab-bar.tsx` — rewritten

Main tabs changed to: **Dashboard, Orders** (badge), **Messages** (badge), **Catering**, **More**

The "More" button opens a slide-up drawer containing 9 overflow items: Products, Customers, Employees, Refunds, Metrics, Queries, Integrations, Shipping, Settings — displayed in a 4-column icon grid. Active state highlighted in warm cream (`#f3ede2`). Backdrop overlay with tap-to-dismiss.

---

## 5.4 Layout — Badge Counts

**File:** `src/app/(admin)/layout.tsx` — updated

Added two `prisma` queries after the tenant resolution:
- `pendingOrders`: `order.count({ where: { tenantId, status: "PENDING" } })`
- `unreadMessages`: `orderMessage.count({ where: { tenantId, side: CUSTOMER, createdAt ≥ 7 days ago } })`

Both run in `Promise.all` so they add a single parallel DB round-trip to the layout. Returns `[0, 0]` when no active tenant.

**File:** `src/components/admin/admin-shell.tsx` — updated

Added `badgeCounts` prop (server → client boundary). Passed through to both `SidebarNav` and `AdminTabBar`.

---

## 5.5 Build Verification

`npm run build` — ✅ compiled successfully, 0 type errors.

All new routes confirmed in build output:
- `/admin/refunds` ✅
- `/admin/messages` ✅
- `/admin/integrations` ✅
- `/admin/employees` ✅
- `/admin/employees/[id]` ✅
- `/admin/settings/carriers` ✅
- `/admin/settings/email-templates` ✅
- `/admin/settings/shipping-rates` ✅

---

## File Manifest

| File | Action |
|------|--------|
| `src/app/(admin)/layout.tsx` | Added badge count queries + `badgeCounts` prop |
| `src/components/admin/admin-shell.tsx` | Added `BadgeCounts` interface + pass-through |
| `src/components/admin/sidebar-nav.tsx` | Rewritten — grouped nav with badges |
| `src/components/admin/admin-tab-bar.tsx` | Rewritten — badges + More drawer |
| `.doa/council/JH-012/gap-analysis.md` | Gap status section added |

---

## Docs Consulted
- `CODING-STANDARDS.md` — async patterns, server components
- `prisma/schema.prisma` — OrderMessage, Order models for badge queries
- `gap-analysis.md` — G-05–G-11 (nav/tab gaps)
- Batch 4 implementation notes — badge data patterns
