# JH-005 — Claude Code: DC Framework Top 5 First Strikes

You are Seat 1 (Workhorse Kang). Read the gap analysis at .doa/council/JH-005/claude-gap-analysis.md. Implement the top 5 highest-impact lowest-effort fixes to align the app with the DC framework design spec.

## BEFORE YOU START
- Read src/app/layout.tsx (font imports)
- Read src/app/globals.css (CSS variables, Tailwind config)
- Read src/components/ui/button.tsx (shadcn button)
- Read src/app/(store)/layout.tsx (storefront layout)
- Read src/app/(store)/shop/page.tsx (shop page)
- Read src/app/(admin)/admin/page.tsx (admin dashboard)

## FIX 1: Font Swap (S effort)
Replace Playfair Display + DM Sans with Marcellus + Hanken Grotesk.
- Import Marcellus and Hanken Grotesk from Google Fonts in layout.tsx
- Update CSS variable --font-heading and --font-body
- Search/replace all font references in globals.css and tailwind config
- Hanken Grotesk weights needed: 400, 500, 600, 700, 800
- Marcellus weight: 400 only (it's a display serif, no bold/italic variants)

## FIX 2: Button Radius → 999px (S effort)
All buttons should be fully rounded pills matching the DC spec.
- Update shadcn Button component default radius to rounded-full
- Or update CSS --radius variable to a large value
- Ensure primary buttons (terracotta #c0563d) and outline buttons both get pill shape
- Check: cart button, CTAs, Add to Cart, admin submit buttons, filter pills

## FIX 3: Announcement Bar (S effort)
Add a sticky announcement bar above the storefront header.
- Dark bg (#2a1f16), cream text, centered, uppercase
- Text: "African Fashion & Healthy Good Food  ·  Worldwide Delivery  ·  Custom Made-To-Order"
- Font: 12px, letter-spacing 1.6px, font-weight 600
- Add to src/app/(store)/layout.tsx above the StoreHeader
- Make it hideable via a prop or env flag (for future tenant customization)

## FIX 4: Made-To-Order CTA (S effort)
Add a "Made-To-Order Clothing" section at the bottom of the shop page.
- Static section after the product grid
- Dashed border card, gold/amber accent
- "✂️" icon, heading "Made-To-Order Clothing", description text
- Dark pill button: "Request a Custom Piece →" linked to mailto:faye.dienaba@yahoo.com?subject=Custom%20Order%20Request
- Add to src/app/(store)/shop/page.tsx

## FIX 5: Customers Admin Page (M effort)
Create a new /admin/customers page showing aggregated customer data from orders.
- Route: src/app/(admin)/admin/customers/page.tsx
- Query: group orders by email, count orders, sum total spent
- Table: Name, Email, Orders (count), Total Spent
- Add "Customers 👥" nav item to the admin sidebar (src/components/admin/sidebar-nav.tsx)
- No schema changes needed — aggregate from existing Order data

## RULES
- Run `npm run build` after all changes — fix any errors
- Write implementation summary to .doa/council/JH-005/claude-implementation.md
- Do NOT commit
