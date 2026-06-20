# JH-006 Fixes — Claude Code: Analytics Gaps

Read .doa/council/JH-006/opencode-validate.md. Fix the 3 issues OpenCode found:

## FIX A: Guard all custom events (HIGH)
- Add `capturePostHogEvent()` helper to src/lib/posthog.ts that checks NODE_ENV === "production" AND NEXT_PUBLIC_POSTHOG_KEY exists before calling posthog.capture()
- Update ALL custom event call sites to use this helper:
  - src/components/analytics/product-view-tracker.tsx
  - src/components/analytics/order-complete-tracker.tsx
  - src/components/store/cart-drawer.tsx
  - src/components/store/checkout-form.tsx

## FIX B: Add tenant to product_viewed (MEDIUM)
- ProductViewTracker accepts tenantId/tenantName props
- Product-card.tsx passes tenant from the card's data context
- Shop/[slug]/page.tsx passes tenant from the resolved tenant

## FIX C: Add explicit add_to_cart event (MEDIUM)
- src/components/store/add-to-cart-button.tsx: in handleAdd(), fire add_to_cart via capturePostHogEvent with product id, name, price, currency, quantity

## RULES
- Run npm run build after changes
- Write summary to .doa/council/JH-006/claude-implementation-fixes.md
