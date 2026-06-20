# JH-003 — Task Data (Phase 3: Storefront + UI Polish)

**Ticket:** JH-003
**Phase:** 3 — Storefront (Days 5-7) + responsive polish
**Date:** 2026-06-19
**Chair:** Prime Kang (Hermes)
**Demo Reference:** https://tevin2119.github.io/jazys-house/

## Scope

Build out all customer-facing storefront pages in Next.js 15 (App Router), matching the static HTML demo site design pixel-for-pixel where applicable, PLUS polish the existing admin UI for mobile responsiveness.

### Customer-Facing Pages (from JH-001 Phase 3)
| Page | Route | Demo Source |
|------|-------|-------------|
| Home | (store)/[domain]/page.tsx | index.html |
| Shop (product grid + category filter) | (store)/[domain]/products/page.tsx | shop.html |
| Product Detail | (store)/[domain]/products/[slug]/page.tsx | shop.html (modal) |
| Cart | (store)/[domain]/cart/page.tsx | Cart overlay in all pages |
| Catering | (store)/[domain]/catering/page.tsx | catering.html |
| About | (store)/[domain]/about/page.tsx | about.html |

### Admin UI Polish
| Area | Current State | Needed |
|------|--------------|--------|
| Admin Layout | Desktop sidebar | Add mobile hamburger + responsive sidebar |
| Product Table/Grid | Desktop table | Responsive card view on mobile |
| Order Management | Desktop table | Responsive layout |
| Dashboard Stats | 4 stat cards | Mobile grid (2x2→1x4) |
| Product Form | Desktop form | Mobile-optimized inputs |
| Tenant Switcher | Topbar dropdown | Mobile-friendly |

### Design System (from Demo)
- **Colors:** Gold/amber (#D4A574, #C4956A), warm earth tones, cream/off-white backgrounds
- **Typography:** Elegant serif headings, clean sans-serif body
- **Spacing:** Generous whitespace, cards with soft shadows
- **Imagery:** Large hero images, product cards with hover effects
- **Mobile:** Hamburger nav, stacked layouts, touch-friendly buttons
- **Brand Voice:** Warm, personal, "From our hands to your heart"
- **Footer:** Multi-column on desktop, stacked on mobile, newsletter signup

### Key Components Needed
```
src/components/store/
  Nav.tsx          — Logo, nav links, cart icon, mobile hamburger
  Hero.tsx         — Full-width hero with CTA
  ProductCard.tsx  — Image, badge, category, name, price, add-to-cart
  ProductGrid.tsx  — Responsive grid (4-col desktop → 2-col tablet → 1-col mobile)
  CategoryFilter.tsx — Horizontal scroll pills on mobile, sidebar on desktop
  CartPanel.tsx    — Slide-out cart overlay
  Footer.tsx       — Multi-section footer
  CateringCard.tsx — Catering package card
  Newsletter.tsx   — Email signup

src/components/admin/
  AdminSidebar.tsx     — Collapsible, mobile-friendly
  AdminHeader.tsx      — Top bar with tenant switcher
  ProductForm.tsx      — Responsive form
  OrderTable.tsx       — Responsive table/cards
  DashboardStats.tsx   — Stats grid
  MobileNav.tsx        — Bottom nav or hamburger for admin mobile

src/components/ui/     — shadcn/ui primitives
```

### Technical Constraints
- Next.js 15 App Router with (store) and (admin) route groups
- Tailwind CSS + shadcn/ui
- Server Components by default, Client Components only where needed (cart, nav toggle)
- Tenant context via x-tenant-id header
- Images: use next/image with Vercel Blob URLs
- All pages must be mobile-first responsive
- PWA-ready (viewport meta, manifest linked)

### Demo Site Assets
- Product data: 59 items across 6 categories in static site's JS catalog
- Images: 63 product/hero images at demo site
- CSS: Extract design tokens from demo (colors, fonts, spacing, shadows)
