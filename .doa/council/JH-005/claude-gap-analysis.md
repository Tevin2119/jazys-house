The gap analysis is written to `.doa/council/JH-005/claude-gap-analysis.md`. Here's what I found:

---

## What I Did

1. **Extracted and decoded** the DC framework's JSON-escaped template (83,007 chars) from the `__bundler/template` script tag using PowerShell.
2. **Read the full template** in sections: storefront header, home, shop, footer, cart drawer, admin dashboard, products, orders, catering, customers, settings, mobile storefront, mobile admin.
3. **Cross-referenced** against all 67 `.tsx` files, `globals.css`, and both layout files.

---

## The 7 Big Divergences

| Area | DC Spec | Existing |
|------|---------|----------|
| **Fonts** | Marcellus (headings) + Hanken Grotesk (body) | Playfair Display + DM Sans |
| **Buttons** | Fully rounded pills (`border-radius:999px`) everywhere | `rounded-md` |
| **Cart** | Right-side slide-in drawer | `/cart` page |
| **Admin sidebar** | Dark `#221913` bg | Light card bg |
| **Mobile admin** | Distinct mobile layout + bottom tab bar (4 tabs) | None — desktop layout with hamburger |
| **Customers page** | Full page: Name/Email/Orders/Spent | Does not exist |
| **Home catering section** | Full-bleed 2-col with chef image + red bg | 3 package cards |

## Gap Counts

- **MISSING** features: 14 (announcement bar, made-to-order CTA, cart drawer, customers page, catering Reply action, mobile admin layout, bottom tab bar, low-stock widget, payment currencies, hero overlay card, and more)
- **DIVERGENT** features: 40+
- **EXISTING EXTRA** (good things not in DC): product detail, checkout, categories admin, order detail, soft-delete, search

## Top 5 First Strikes (high impact, low effort)

1. Font swap (Marcellus + Hanken Grotesk) — `S`
2. Button radius to `999px` — `S`
3. Announcement bar — `S`
4. Made-To-Order CTA on shop — `S`
5. `/admin/customers` page — `M`
 variant |
| G-4 | Card bg `#fffdf9`, border `#ece2d2` | Card `#ffffff`, border `#e0d5c5` | DIVERGENT | LOW | XS — CSS var tweak |
| G-5 | Page bg `#f6efe4` | `#faf6f0` | DIVERGENT | LOW | XS — CSS var tweak |
| G-6 | Warm section bg `#efe4d2` | `#f5ede0` | DIVERGENT | LOW | XS — CSS var tweak |
| G-7 | Admin dark bg `#221913`, footer bg `#221913` | Not used (admin is light) | DIVERGENT | MEDIUM | S |

---

### SECTION 2 — Storefront Header

| # | Feature | DC Framework | Existing | Status | Priority | Effort |
|---|---|---|---|---|---|---|
| H-1 | **Announcement bar** | Dark bar: "African Fashion & Healthy Good Food · Worldwide Delivery · Custom Made-To-Order", configurable boolean prop | Not present | MISSING | HIGH | S — add sticky div above header |
| H-2 | **Logo shape** | Circle (`border-radius:50%`) with 1.5px gold border | `rounded-md` square | DIVERGENT | LOW | XS — CSS class change |
| H-3 | **Store name font** | Marcellus, 19px, regular weight (not italic, not bold) | `font-heading` bold italic | DIVERGENT | MEDIUM | S — tied to G-1 |
| H-4 | **Tagline** | "AFRICAN FASHION & GOOD FOOD" in `#a3442e`, 8.5px, letter-spacing 2px | "African Fashion & Healthy Good Food" in primary, 0.5rem | DIVERGENT | LOW | XS |
| H-5 | **Cart button** | Pill button (`#c0563d` bg, white text) "🛒 {count}" — opens drawer | `🛒` emoji link to `/cart` page | DIVERGENT | HIGH | M — tied to cart drawer (C-1) |
| H-6 | **Nav link style** | 14.5px, weight 600, no uppercase | `xs uppercase tracking-wider` | DIVERGENT | LOW | XS |

---

### SECTION 3 — Storefront: Home Page

| # | Feature | DC Framework | Existing | Status | Priority | Effort |
|---|---|---|---|---|---|---|
| S-1 | **Hero image** | Real product image (ankara dress) fills right column; floating "100% / Handmade & Authentic" white card overlay bottom-left | Giant 🌍 emoji (12rem) | DIVERGENT | HIGH | M — needs real image asset + overlay card component |
| S-2 | **Hero floating overlay card** | White card bottom-left of image: "100%" in terracotta, "Handmade & Authentic" sub-label | Not present | MISSING | MEDIUM | S |
| S-3 | **Hero sub-label** | "Handmade in small batches · Est. 2025" — uppercase, `#a3442e` | Badge: "African Fashion & Healthy Good Food · Worldwide Delivery" in muted | DIVERGENT | LOW | XS |
| S-4 | **Hero H1 style** | Marcellus 62px, weight 400 (not italic, not bold) | Playfair bold italic 5xl | DIVERGENT | HIGH | S — tied to G-1 |
| S-5 | **Hero CTA buttons** | 2 pills: "Shop the Collection" (terracotta) + "Book Catering" (bordered) | 3 buttons: Shop Fashion, Shop Superfoods, Book Catering | DIVERGENT | MEDIUM | S |
| S-6 | **Benefits strip** | 4 items on `#efe4d2` bg; icons in 46px white circles; uses "Authentic Fabrics 🪡" | 4 items center-aligned, text-only emoji, `border-bottom` | DIVERGENT | LOW | XS |
| S-7 | **Featured heading layout** | Single row: label + "Handpicked for You" left, "View Full Collection →" link right (flex space-between) | `SectionHeading` 3-line stack; link below grid | DIVERGENT | MEDIUM | S |
| S-8 | **Featured product card** | Marcellus name (18px, regular), category in terracotta uppercase 10.5px, pill "Add" button | `font-medium` name, terracotta price, "Add to cart" full-width button | DIVERGENT | MEDIUM | M — card redesign |
| S-9 | **Catering section** | Full-bleed 2-column (`1fr 1fr`): left = text panel on terracotta `#c0563d` bg; right = chef image (min-height 440px) | 3 package cards on warm bg | DIVERGENT | HIGH | M — full section rebuild |
| S-10 | **Lookbook layout** | 4-column fixed (`repeat(4,1fr)`), plain `height:280px` images, no aspect ratio | Responsive 2/3/4-col, `aspect-[3/4]` | DIVERGENT | LOW | XS |
| S-11 | **Newsletter section** | Standalone dark section (`#2a1f16`): "Join the Family", 10% off copy, pill email+button — between lookbook and footer | Embedded in footer top | DIVERGENT | MEDIUM | S — extract to standalone section |
| S-12 | **Pantry section** | Not present on DC home page | Present ("African Superfoods") | EXISTING ONLY | — | — |

---

### SECTION 4 — Storefront: Shop Page

| # | Feature | DC Framework | Existing | Status | Priority | Effort |
|---|---|---|---|---|---|---|
| SH-1 | **Search box** | Not present | ✅ Search form above category pills | EXISTING EXTRA | LOW | — |
| SH-2 | **Category pills** | Horizontal row, fully rounded, 7 categories (all, Women, Men, Kids, Accessories, Pantry, Home) | Same approach, same 7 | MATCHING | — | — |
| SH-3 | **Product grid** | `auto-fill minmax(244px,1fr)` | 2→3→4-col responsive | DIVERGENT | LOW | XS |
| SH-4 | **Made-To-Order CTA** | ✅ Bottom of shop: dashed gold-border card, "✂️ Made-To-Order Clothing", dark pill button "Request a Custom Piece →" | ❌ Not present | MISSING | HIGH | S — add static section after product grid |

---

### SECTION 5 — Storefront: Footer

| # | Feature | DC Framework | Existing | Status | Priority | Effort |
|---|---|---|---|---|---|---|
| F-1 | **Newsletter placement** | Separate dark section above footer | Top of footer | DIVERGENT | MEDIUM | S |
| F-2 | **Phone number** | ✅ "080-4357-0980" in Company column | ❌ Email only | MISSING | LOW | XS |
| F-3 | **Social links** | Instagram, TikTok, Pinterest, Facebook | Instagram, TikTok only | PARTIAL | LOW | XS |
| F-4 | **Payment currencies row** | ✅ "Pay in ¥ JPY · £ GBP · $ USD · € EUR · CFA Franc (XOF)" in footer bottom bar | ❌ Not present | MISSING | MEDIUM | XS |
| F-5 | **Footer column widths** | `1.6fr 1fr 1fr 1fr` | `sm:grid-cols-2 lg:grid-cols-4` | DIVERGENT | LOW | XS |
| F-6 | **Footer bg color** | `#221913` | `var(--foreground)` `#2c1810` | DIVERGENT | LOW | XS |

---

### SECTION 6 — Desktop Cart Drawer

| # | Feature | DC Framework | Existing | Status | Priority | Effort |
|---|---|---|---|---|---|---|
| C-1 | **Cart as drawer** | Fixed right-side drawer (380px), slide-in transform animation, dark overlay | Separate `/cart` page | DIVERGENT | HIGH | L — new `<CartDrawer>` client component + Zustand state |
| C-2 | **Cart overlay** | Semi-transparent dark bg (`rgba(42,31,22,0.45)`) closes drawer on click | N/A | MISSING | MEDIUM | S — part of C-1 |
| C-3 | **Cart slide animation** | `transform:translateX(108%) → 0`, `transition:.35s cubic-bezier(.4,0,.2,1)` | N/A | MISSING | LOW | XS — CSS only, part of C-1 |
| C-4 | **Cart item layout** | Thumbnail (image or colored placeholder), remove ✕, qty × price line total | Same, but on `/cart` page | MATCHING (different location) | — | — |

---

### SECTION 7 — Admin: Layout & Shell

| # | Feature | DC Framework | Existing | Status | Priority | Effort |
|---|---|---|---|---|---|---|
| A-1 | **Sidebar bg color** | `#221913` (dark warm brown) | `bg-card` (white) | DIVERGENT | MEDIUM | S |
| A-2 | **Sidebar user profile** | Bottom of sidebar: gold initial circle, name "Dienaba F.", role "Store Owner" | UserMenu in top bar only | DIVERGENT | MEDIUM | S |
| A-3 | **Active nav item style** | Full-width row terracotta bg + white text | `bg-primary text-primary-foreground` | DIVERGENT | LOW | XS |
| A-4 | **Top bar: notification bell** | ✅ 🔔 icon in top bar | ❌ Missing | MISSING | LOW | S |
| A-5 | **Top bar: store URL** | ✅ "jazyshouse-african.com" plaintext label | "Active store" dot indicator | DIVERGENT | LOW | XS |
| A-6 | **Main content area bg** | `#f3ede2` (warm beige) | `bg-muted/30` | DIVERGENT | LOW | XS |
| A-7 | **Admin sidebar logo** | Circular logo with gold border | `rounded-md` logo | DIVERGENT | LOW | XS |

---

### SECTION 8 — Admin: Navigation

| # | Feature | DC Framework | Existing | Status | Priority | Effort |
|---|---|---|---|---|---|---|
| N-1 | **Customers page in nav** | ✅ "Customers 👥" nav item | ❌ Not in nav; page does not exist | MISSING | HIGH | M — new page + aggregate query |
| N-2 | **Categories page** | ❌ Not in DC nav | ✅ Present | EXISTING EXTRA | — | — |
| N-3 | **Nav icons** | Emoji icons (📊 🧺 📦 🍲 👥 ⚙️) | Lucide icons | DIVERGENT | LOW | XS |

---

### SECTION 9 — Admin: Dashboard

| # | Feature | DC Framework | Existing | Status | Priority | Effort |
|---|---|---|---|---|---|---|
| D-1 | **Greeting** | "Good morning, Dienaba 👋" + date "Thursday, 19 June 2026" | "Welcome back, {name}." | DIVERGENT | MEDIUM | S |
| D-2 | **Stat card trend line** | Sub-line: "+18% vs May" / "6 awaiting action" / "6 categories" / "2 new this week" | Number only, no trend | PARTIAL | MEDIUM | M — requires additional aggregation queries |
| D-3 | **Stat card visual** | `#fffdf9` card, `border-radius:13px`, label in terracotta, Marcellus value 34px | shadcn Card | DIVERGENT | LOW | S |
| D-4 | **Dashboard 2-col layout** | `1.7fr` (orders table) + `1fr` (Low Stock + Catering widgets) | `lg:grid-cols-2` equal split | DIVERGENT | MEDIUM | S |
| D-5 | **Low Stock widget** | ✅ Sidebar card: 3 low-stock items with colored stock pills | ❌ Not present | MISSING | MEDIUM | M — Prisma query + widget component |
| D-6 | **Recent Orders table** | Custom grid columns, 6 rows, color-coded status pills | shadcn Table, 5 rows | DIVERGENT | LOW | XS |
| D-7 | **Catering widget** | Name + date + one-line summary, 2 inquiries | Full shadcn Table | DIVERGENT | LOW | S |

---

### SECTION 10 — Admin: Products

| # | Feature | DC Framework | Existing | Status | Priority | Effort |
|---|---|---|---|---|---|---|
| P-1 | **Product count label** | "X of Y products" above table | ❌ Missing | MISSING | LOW | XS |
| P-2 | **Status column** | 3-state: "In stock" (green) / "Low stock" (orange) / "Out of stock" (red) — derived from `stock` field | "Active" / "Deleted" (soft-delete status) | DIVERGENT | HIGH | M — needs stock thresholds + colored pill badges |
| P-3 | **Delete/restore** | ❌ Edit link only; no delete in DC | ✅ Soft-delete + restore | EXISTING EXTRA | — | — |
| P-4 | **Badge column** | ❌ Not in product table | ✅ Present | EXISTING EXTRA | — | — |
| P-5 | **Stock count column** | ❌ Not shown | ✅ Present | EXISTING EXTRA | — | — |

---

### SECTION 11 — Admin: Orders

| # | Feature | DC Framework | Existing | Status | Priority | Effort |
|---|---|---|---|---|---|---|
| O-1 | **Status filter** | Inline pill buttons row (ALL + 5 statuses) | shadcn `<SelectFilter>` dropdown | DIVERGENT | MEDIUM | M — new filter pill component |
| O-2 | **Status badge colors** | PENDING=amber, PROCESSING=blue, SHIPPED=purple, DELIVERED=green, CANCELLED=red | `OrderStatusBadge` (similar mapping) | DIVERGENT | LOW | XS |
| O-3 | **Order detail page** | ❌ Not shown in DC | ✅ Present | EXISTING EXTRA | — | — |

---

### SECTION 12 — Admin: Catering

| # | Feature | DC Framework | Existing | Status | Priority | Effort |
|---|---|---|---|---|---|---|
| CA-1 | **Layout** | Card grid (`auto-fill minmax(320px,1fr)`) | Table view | DIVERGENT | HIGH | M — redesign as card grid |
| CA-2 | **Card content** | Name (Marcellus), package (terracotta), guests 👥 + date 📅, message excerpt, status badge, Reply + View buttons | Dense table row | DIVERGENT | HIGH | M |
| CA-3 | **Reply action** | ✅ "Reply" button per card | ❌ No reply functionality | MISSING | HIGH | L — requires reply flow (email/notes/modal) |
| CA-4 | **Status change** | Status shown as colored badge (no inline editor visible in DC) | `<CateringStatusSelect>` dropdown per row | DIVERGENT | MEDIUM | S |

---

### SECTION 13 — Admin: Customers

| # | Feature | DC Framework | Existing | Status | Priority | Effort |
|---|---|---|---|---|---|---|
| CU-1 | **Customers page** | ✅ Table: Name, Email, Orders count, Total Spent | ❌ Completely absent | MISSING | HIGH | M — new `/admin/customers` page + aggregate Prisma query |
| CU-2 | **Customers data model** | Derived from `order.email` / `order.name` grouped aggregate | No `Customer` model needed — same approach | MISSING | HIGH | S — groupBy query, no schema change |

---

### SECTION 14 — Admin: Settings

| # | Feature | DC Framework | Existing | Status | Priority | Effort |
|---|---|---|---|---|---|---|
| SE-1 | **Currency selector** | Pill selector: GBP / JPY / USD / EUR (inline toggle) | Read-only display label | DIVERGENT | MEDIUM | M — needs update action |
| SE-2 | **Brand theme** | 4 color swatches (terracotta, green, blue, purple) click to select | `ThemeEditor` with hex color inputs (more capable) | DIVERGENT | LOW | — |
| SE-3 | **Domain field** | Editable text input | Read-only | DIVERGENT | LOW | — |

---

### SECTION 15 — Mobile: Storefront

| # | Feature | DC Framework | Existing | Status | Priority | Effort |
|---|---|---|---|---|---|---|
| M-1 | **Mobile home hero** | Full-width product image (340px) with dark gradient overlay; H1 + CTA button overlaid on image | Same 2-col layout as desktop, scaled down | DIVERGENT | HIGH | M — mobile-specific hero variant |
| M-2 | **Mobile menu drawer** | Full-screen dark overlay (`#2a1f16`) with large Marcellus nav links + contact info | Dropdown list below header | DIVERGENT | MEDIUM | M — full-screen slide-over component |
| M-3 | **Mobile benefits** | 2×2 grid tiles with icon+text | 4-item grid | DIVERGENT | LOW | S |
| M-4 | **Mobile catering promo** | Card: catering image + terracotta text panel + button | 3 package cards | DIVERGENT | MEDIUM | M |
| M-5 | **Mobile newsletter** | Compact pill-input + button inline, dark card | In footer | DIVERGENT | LOW | S |
| M-6 | **Mobile shop** | Horizontal scroll category pills (hidden scrollbar), 2-col grid | Wrapped pills, 2-col grid | DIVERGENT | LOW | S |
| M-7 | **Mobile cart** | Full-page view within storefront | `/cart` page (same, responsive) | MATCHING | — | — |

---

### SECTION 16 — Mobile: Admin

| # | Feature | DC Framework | Existing | Status | Priority | Effort |
|---|---|---|---|---|---|---|
| MA-1 | **Dedicated mobile admin layout** | Fully separate mobile-optimized views (distinct from desktop) | No dedicated mobile admin; desktop layout with hamburger sidebar | MISSING | HIGH | L — significant build |
| MA-2 | **Bottom tab bar** | Fixed bottom tabs: Dashboard 📊 / Products 🧺 / Orders 📦 / Catering 🍲 | ❌ Not present | MISSING | HIGH | M — new `<AdminTabBar>` client component |
| MA-3 | **Mobile admin topbar** | Dark `#221913` header with logo + current page title + gold avatar | Light header with hamburger toggle | DIVERGENT | MEDIUM | M |
| MA-4 | **Mobile dashboard** | 2×2 stat grid, compact recent orders list | No mobile-specific layout | MISSING | MEDIUM | S |
| MA-5 | **Mobile product list** | Thumbnail + name + price + status pill per row | Card grid (same for all sizes) | PARTIAL | LOW | S |
| MA-6 | **Mobile orders** | Horizontal scroll filter pills + compact list | `md:hidden` card list | PARTIAL | LOW | XS |
| MA-7 | **Mobile catering** | Card stack with Reply button | No mobile-specific layout | MISSING | MEDIUM | S |
| MA-8 | **Customers + Settings mobile** | Customers not in tab bar (accessible but not tabbed); compact Settings form | N/A | PARTIAL | LOW | S |

---

## Priority Summary

### HIGH — Missing core feature or major visual/UX divergence

| ID | Description |
|----|-------------|
| G-1/G-2 | Font stack mismatch (Playfair+DM Sans vs Marcellus+Hanken Grotesk) |
| G-3 | Buttons not pill-rounded — affects every CTA in the app |
| H-1 | Announcement bar missing from storefront |
| H-5 / C-1 | Cart button is a link; DC spec is a pill button opening a slide-in drawer |
| S-1/S-4 | Hero uses emoji placeholder; DC uses real product image with floating overlay card |
| S-9 | Home catering section (full-bleed 2-col with chef image vs 3 package cards) |
| SH-4 | Made-To-Order CTA missing from shop bottom |
| N-1 / CU-1 | Customers admin page does not exist |
| CA-1/CA-2/CA-3 | Admin catering is a table; DC spec is card grid with Reply action |
| P-2 | Product status column shows active/deleted; DC shows stock levels (In/Low/Out of stock) |
| M-1 | Mobile home hero (product image with overlay vs scaled emoji layout) |
| MA-1 / MA-2 | No dedicated mobile admin layout; no bottom tab bar |

### MEDIUM — Different approach, same function

| ID | Description |
|----|-------------|
| G-7 / A-1 | Admin sidebar not dark |
| S-5 / S-7 / S-8 | Hero CTAs, featured heading layout, product card design |
| S-11 / F-4 | Newsletter placement; payment currencies row missing |
| A-2 | Sidebar user profile at bottom |
| D-1 / D-2 / D-4 / D-5 | Dashboard greeting, trend data, layout, low-stock widget |
| O-1 | Order filter pills vs dropdown |
| CA-4 | Catering status change UX |
| SE-1 | Currency selector (pills vs read-only) |
| M-2 / M-4 | Mobile menu drawer; mobile catering promo |
| MA-3 / MA-4 | Mobile admin topbar; mobile dashboard layout |

### LOW — Cosmetic / minor

| ID | Description |
|----|-------------|
| G-4/G-5/G-6 | Exact shade differences (bg, card, border) |
| H-2/H-4/H-6 | Logo shape, tagline copy, nav link casing |
| S-3/S-6/S-10 | Hero sub-label, benefits icons, lookbook grid |
| F-2/F-3/F-5/F-6 | Footer: phone number, social links, column widths, bg shade |
| A-3 through A-7 | Minor admin UI details (active style, bell, URL, bg, logo) |
| D-3/D-6/D-7 | Stat card visuals, orders table, catering widget |
| N-3 | Nav icons (emoji vs Lucide) |
| P-1/P-4/P-5 | Product count label, badge and stock columns |
| O-2 | Order status badge colors |
| SE-2/SE-3 | Theme editor approach, domain field editability |
| M-3/M-5/M-6 | Mobile minor layout details |
| MA-5/MA-6/MA-7/MA-8 | Mobile admin minor layouts |

---

## Effort Legend

| Label | Description |
|-------|-------------|
| XS | < 30 min — CSS variable or copy change |
| S | 30 min – 2 hrs — single file or small component edit |
| M | 2–6 hrs — new component or significant page refactor |
| L | 6+ hrs — new page + data layer + multiple components |

---

## What Exists Only in the Next.js App (Not in DC)

These are additions in the existing app not visible in the DC framework. They should generally be retained:

| Feature | Location |
|---------|----------|
| Product detail page (`/shop/[slug]`) | Not shown in DC — intentional addition |
| Checkout page + Stripe integration | Not in DC — platform requirement |
| Categories admin page | DC has no such page |
| Order detail page (`/admin/orders/[id]`) | DC has no order detail view |
| Product soft-delete/restore | DC only shows Edit |
| Shop search box | DC has no search |
| Pantry section on home | DC does not show it |
| Lookbook aspect-ratio responsive grid | DC is 4-col fixed |

---

## Top 5 Recommended First Strikes

Highest impact vs effort ratio:

1. **G-1/G-2 — Font stack** (`S`): Replace `Playfair_Display` + `DM_Sans` with `Marcellus` + `Hanken_Grotesk` in `layout.tsx`. Ripples through the entire app instantly with no other changes needed.

2. **G-3 — Button radius** (`S`): Change shadcn Button's default `rounded-md` to `rounded-full`, or add `border-radius:9999px` to `--radius` and update the primary button variant. Transforms every CTA instantly.

3. **H-1 — Announcement bar** (`S`): Single `<div>` above `<StoreHeader>` in `(store)/layout.tsx`. "African Fashion & Healthy Good Food · Worldwide Delivery · Custom Made-To-Order". High visibility, zero data deps.

4. **SH-4 — Made-To-Order CTA** (`S`): Append a static `<section>` after the product grid in `/shop/page.tsx`. Dashed border, ✂️ icon, dark pill CTA. No data required.

5. **CU-1 — Customers admin page** (`M`): Aggregate `prisma.order` by `email`, compute `order count` + `sum(total)`, build `/admin/customers/page.tsx`. The data is already in the DB; no schema change needed.

---

*Docs consulted: DC framework HTML (decoded and read in full), all 67 `src/**/*.tsx` files (key pages read directly), `globals.css`, both layout files.*
