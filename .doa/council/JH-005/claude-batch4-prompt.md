# JH-005 Batch 4 — Claude Code: Mobile DC Framework Alignment

Read .doa/council/JH-005/claude-gap-analysis.md sections 15-16 (Mobile Storefront + Mobile Admin).

## FIX 15: Mobile Menu Drawer (M effort)
DC spec: full-screen dark overlay (#2a1f16) with large Marcellus nav links + contact info at bottom.
- New component: src/components/store/mobile-menu.tsx (Client)
- Triggered by hamburger icon in store-header
- Links: Home, Shop, Catering, Our Story
- Bottom: email + phone
- File: src/components/store/store-header.tsx (add hamburger + wire)

## FIX 16: Mobile Home Hero (M effort)
DC spec: full-width product image (340px) with dark gradient overlay, H1 + CTA overlaid.
- Add mobile-specific hero variant in src/app/(store)/page.tsx
- Use md:hidden for mobile version, existing hero for md+
- Product image + gradient overlay + heading + CTA button on top

## FIX 17: Mobile Admin Bottom Tab Bar (L effort)
DC spec: fixed bottom tabs — Dashboard 📊 / Products 🧺 / Orders 📦 / Catering 🍲
- New component: src/components/admin/admin-tab-bar.tsx (Client)
- Active tab: terracotta color, bold. Inactive: muted, lower opacity.
- Wire to admin layout — show on mobile only (md:hidden)
- Each tab navigates to the corresponding admin section
- File: src/app/(admin)/layout.tsx

## FIX 18: Mobile Catering Promo (S effort)
DC spec: card with catering image + terracotta text panel + button on mobile home.
- Add mobile-specific catering promo in store page
- md:hidden card with image + text overlay + CTA

## RULES
- Read existing files before editing
- Run npm run build after all changes
- Write summary to .doa/council/JH-005/claude-implementation-batch4.md
