# JH-005 Batch 2 — Claude Code: DC Framework Alignment (Quick Wins)

You are Seat 1 (Workhorse Kang). Read the gap analysis at .doa/council/JH-005/claude-gap-analysis.md. This is Batch 2 — high-impact S-effort fixes.

## FIX 6: Dark Admin Sidebar (S effort)
DC spec: sidebar bg #221913 (dark warm brown). Current: light card bg.
- Update src/components/admin/sidebar-nav.tsx or admin-shell.tsx
- Active nav item: terracotta bg + white text
- Inactive nav: #cbb9a3 muted gold text
- Add sidebar bottom section: user profile with gold initial circle + name + role

## FIX 7: Dashboard Polish (S-M effort)
DC spec has a richer dashboard:
- Greeting: "Good morning, Dienaba 👋" + date "Thursday, 19 June 2026" (use new Date() for dynamic)
- Stat cards: label in terracotta uppercase, Marcellus value 34px, trend sub-line
- Add Low Stock widget: query products where stock <= 8, show colored pills
- Layout: 1.7fr orders + 1fr widgets (dashboard 2-col split)
- File: src/app/(admin)/admin/page.tsx

## FIX 8: Payment Currencies Row (S effort)
DC spec footer has: "Pay in ¥ JPY · £ GBP · $ USD · € EUR · CFA Franc (XOF)"
- Add to src/components/store/store-footer.tsx above copyright

## FIX 9: Newsletter as Standalone Section (S effort)
DC spec has a standalone dark section between lookbook and footer: "Join the Family" + 10% off + pill email input + button.
- Extract from footer, create standalone section in src/app/(store)/page.tsx
- Dark bg #2a1f16, centered, pill input + pill CTA button

## FIX 10: Order Filter Pills (M effort)
DC spec has inline pill buttons for order status filtering (ALL + 5 statuses). Current: dropdown.
- Replace SelectFilter dropdown with horizontal scroll pill row in src/app/(admin)/admin/orders/page.tsx
- Active pill: terracotta bg + white text. Inactive: white bg + muted border.
- Same behavior, different UX

## RULES
- Read existing files before editing
- Run npm run build after all changes — fix any errors
- Write summary to .doa/council/JH-005/claude-implementation-batch2.md
- Do NOT commit
