# JH-003 — Claude Code Prompt: Storefront UI + Responsive Polish

## INSTRUCTIONS FOR CLAUDE CODE

You are Seat 1 (Workhorse Kang) on the Jazy's House Platform council. This is ticket JH-003: Phase 3 Storefront UI + responsive admin polish. Your job: implement the UI markup for ALL customer-facing storefront pages AND make the admin UI mobile-responsive.

### PROJECT CONTEXT
- Next.js 15 App Router with (store)/[domain]/ and (admin)/ route groups
- Tailwind CSS + shadcn/ui components
- Server Components by default, Client Components only where needed
- Tenant context via x-tenant-id header (already wired in middleware)
- Prisma + PostgreSQL backend (already working)
- Existing admin pages at src/app/(admin)/ — they work but are desktop-only

### DEMO REFERENCE (pixel-match target)
- Live demo: https://tevin2119.github.io/jazys-house/
- Pages to replicate: index.html, shop.html, about.html, catering.html
- The demo uses warm earth tones, gold/amber accents (#D4A574), cream backgrounds, serif headings, generous whitespace
- Extract design tokens by viewing the demo CSS

### BUILD THIS — Customer-Facing Storefront

#### 1. Store Layout Shell — `src/app/(store)/layout.tsx`
- Shared layout: Nav + Footer wrapping children
- Nav: Logo (left), nav links (center), cart icon with count (right), mobile hamburger
- Footer: 4-column on desktop (Shop, Company, Follow, Newsletter), stacked on mobile
- Include the "We Deliver Worldwide" banner + currency line

#### 2. Home Page — `src/app/(store)/[domain]/page.tsx`
- Hero section: full-width image or gradient, tagline "African Fashion Handmade with Soul", CTA button → /shop
- Featured Products: fetch top 4 products from DB, display as ProductCard grid
- Category teaser: 6 category circles/cards → link to /shop?cat=women etc.
- Catering teaser: 3 catering packages with images
- Pantry teaser: 3-4 pantry products
- Newsletter signup section
- Match demo's visual rhythm: sections separated by generous padding

#### 3. Shop Page — `src/app/(store)/[domain]/products/page.tsx`
- Category filter: horizontal scroll pills on mobile, vertical sidebar on desktop
- Product grid: 4-col desktop, 2-col tablet, 1-col mobile
- Each product card: image, badge (BESTSELLER/NEW/SALE), category label, name, price, "Add to Cart" button
- Search input at top
- Custom Orders section at bottom (like demo's "Made-to-Order Clothing" block)

#### 4. Product Detail — `src/app/(store)/[domain]/products/[slug]/page.tsx`
- Product image(s) — gallery or main image
- Name, price, description
- Badge display
- Quantity selector + "Add to Cart" button
- Back to shop link
- Related products section

#### 5. Cart Page — `src/app/(store)/[domain]/cart/page.tsx`
- Cart items list with image, name, price, qty controls, remove button
- Subtotal / Total
- "Continue Shopping" + "Checkout" buttons
- Empty cart state with CTA to shop

#### 6. Catering Page — `src/app/(store)/[domain]/catering/page.tsx`
- 6 catering packages as cards (Taste of Africa through Full Event Catering)
- Each: image, name, description, price, "Inquire" button
- Inquiry form at bottom: name, email, date, guests, package dropdown, message
- POST to /api/contact (or catering endpoint)

#### 7. About Page — `src/app/(store)/[domain]/about/page.tsx`
- Hero: "From Our Hands to Your Heart"
- Chef image + "The Vision" section
- Values: Craftsmanship, Authenticity, Community, Boldness — 4 cards with icons
- "Stay Connected" newsletter CTA
- Match the demo's about.html exactly in tone and layout

### BUILD THIS — Admin Mobile-Responsive Polish

#### 8. Admin Layout — `src/app/(admin)/layout.tsx`
- Add mobile hamburger toggle that hides/shows sidebar
- Sidebar: collapsible on mobile, fixed on desktop
- Top bar: tenant switcher + user menu (already exists, ensure mobile-friendly)
- Mobile: sidebar overlays content, closes on nav or backdrop tap

#### 9. Responsive Admin Tables
- Products table → card grid on mobile (image thumbnail, name, price, status)
- Orders table → stacked cards on mobile (order #, customer, total, status badge)
- Use CSS grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` patterns

#### 10. Dashboard Stats
- 4 stat cards: `grid-cols-2 lg:grid-cols-4` (2x2 on mobile, 4 across on desktop)

### COMPONENTS TO CREATE
```
src/components/store/
  Nav.tsx            — server component? No — client (cart state, mobile toggle)
  Hero.tsx           — server component
  ProductCard.tsx    — server component (data passed as props)
  ProductGrid.tsx    — server component
  CategoryFilter.tsx — client component (URL param interaction)
  CartPanel.tsx      — client component (cart state)
  CartItem.tsx       — client component
  Footer.tsx         — server component
  CateringCard.tsx   — server component
  Newsletter.tsx     — client component (form submission)

src/components/admin/
  AdminSidebar.tsx   — client component (mobile toggle)
  AdminHeader.tsx    — client component (tenant switcher)
  MobileNav.tsx      — client component (hamburger + overlay)

src/components/ui/   — shadcn/ui (already installed)
```

### RULES
1. Server Components by default. Only use 'use client' when you need interactivity (onClick, useState, useEffect, cart state).
2. Fetch data server-side with Prisma in the page.tsx, pass as props to child components.
3. Mobile-first: write Tailwind classes mobile-first (unprefixed = mobile, md: = tablet, lg: = desktop).
4. Match the demo's visual design — review the demo CSS before writing Tailwind classes.
5. Use next/image for all images with proper width/height.
6. Use shadcn/ui components wherever applicable (Button, Input, Card, Badge, Sheet for cart panel, Dialog).
7. Run `npm run build` after all changes — fix any TypeScript errors.
8. Do NOT commit. Write a summary of all files changed to `.doa/council/JH-003/implementation-report.md`.

### DESIGN TOKENS (from demo)
- Primary gold: #D4A574 / amber-400
- Dark text: #1a1a1a / gray-900
- Background: #faf8f5 / warm cream
- Card bg: white with shadow-sm
- Font headings: serif (Playfair Display or Georgia fallback)
- Font body: sans-serif (system stack)
- Border radius: rounded-lg (8px)
- Buttons: bg-amber-500 hover:bg-amber-600 text-white rounded-full px-6 py-3

Start by reading the existing codebase structure, then implement page by page. Build all storefront pages first, then polish admin mobile. Verify with `npm run build`.
