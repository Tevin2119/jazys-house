# JH-005 Batch 3 — Claude Code: DC Framework (Heavy Lifts)

Read .doa/council/JH-005/claude-gap-analysis.md. This batch covers the M-L effort items.

## FIX 11: Cart Slide-In Drawer (L effort)
Replace the /cart page with a slide-in drawer from the right side.
- New component: src/components/store/cart-drawer.tsx (Client)
- 380px wide drawer, transform:translateX animation, dark overlay
- Same cart item layout (thumbnail, name, qty, remove ✕, line total)
- Open via cart button in header (pill button with 🛒 + count)
- Zustand store or existing cart state
- Update src/components/store/store-header.tsx — cart button opens drawer instead of linking to /cart
- Keep /cart page as fallback for direct URL access

## FIX 12: Home Hero With Product Image (M effort)
Replace the giant emoji hero with a real product image layout matching DC spec:
- Right column: product image (use first featured product's image or a hero image from R2)
- Left column: heading (Marcellus 62px), sub-label, 2 pill CTAs
- Floating overlay card bottom-left of image: "100%" in terracotta + "Handmade & Authentic"
- File: src/app/(store)/page.tsx

## FIX 13: Home Catering Section (M effort)
Replace 3 package cards with DC spec full-bleed 2-col layout:
- Left: text panel on terracotta #c0563d bg — "Catering" label, "The Taste of Home" heading (Marcellus 44px, white), description, "Explore Catering →" white pill button
- Right: chef image (use existing catering image or placeholder), min-height 440px, object-fit cover
- File: src/app/(store)/page.tsx

## FIX 14: Admin Catering Card Grid (M effort)
Replace table view with DC spec card grid:
- auto-fill minmax(320px,1fr) card grid
- Each card: name (Marcellus), package (terracotta label), guests+date, message excerpt, status badge, Reply button
- File: src/app/(admin)/admin/catering/page.tsx

## RULES
- Read existing files, understand data flow before editing
- Run npm run build after changes
- Write summary to .doa/council/JH-005/claude-implementation-batch3.md
