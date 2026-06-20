All three fixes are done and the build passes clean. Here's what was changed:

**FIX A — `capturePostHogEvent()` helper (10 files):**
- Added the helper to `src/lib/posthog.ts` — double-guards on `NODE_ENV === "production"` AND `NEXT_PUBLIC_POSTHOG_KEY` before calling the PostHog SDK.
- Replaced all 4 raw `posthog.capture()` call sites (`product-view-tracker`, `order-complete-tracker`, `cart-drawer`, `checkout-form`) with the guarded helper.

**FIX B — Tenant context on `product_viewed`:**
- `ProductViewTracker` now accepts optional `tenantId`/`tenantName` props and includes them in the event payload.
- `ProductCard` threads those props down to the tracker.
- All three pages that render product cards (`/shop`, `/shop/[slug]` related grid, `/` home) now pass `tenant.id` and `tenant.name`.

**FIX C — Explicit `add_to_cart` event:**
- `AddToCartButton` now accepts an optional `currency` prop and fires `capturePostHogEvent("add_to_cart", {...})` with product id, name, price, currency, and quantity 1 inside `handleAdd()`.
- All callers that have currency context (`product-card.tsx`, `/shop/[slug]/page.tsx`) pass it through.
viewed` (MEDIUM)

**`src/components/analytics/product-view-tracker.tsx`:** Added optional `tenantId?: string` and `tenantName?: string` props. Both are spread into the event payload as `tenant_id` / `tenant_name` when present.

**`src/components/store/product-card.tsx`:** Added `tenantId?: string` and `tenantName?: string` props, passed through to `ProductViewTracker`. Also passes `currency` to `AddToCartButton` (prerequisite for FIX C).

**Pages updated to pass tenant context to `ProductCard` and `ProductViewTracker`:**

| File | Change |
|---|---|
| `src/app/(store)/shop/page.tsx` | tenantId/tenantName on ProductCard |
| `src/app/(store)/shop/[slug]/page.tsx` | tenantId/tenantName on ProductCard (related) and direct ProductViewTracker; currency on inline AddToCartButton |
| `src/app/(store)/page.tsx` | tenantId/tenantName on both ProductCard usages (featured + pantry grids) |

## FIX C: Explicit `add_to_cart` event (MEDIUM)

**`src/components/store/add-to-cart-button.tsx`:**

- Added optional `currency?: string` prop (passed from callers that have tenant context).
- In `handleAdd()`, after `addItem(product)`, fires:

```ts
capturePostHogEvent("add_to_cart", {
  product_id: product.productId,
  product_name: product.name,
  price: product.price / 100,
  ...(currency ? { currency } : {}),
  quantity: 1,
});
```

`quantity` is always 1 — `addItem` increments existing lines so each button click is a +1 delta.

## Funnel Coverage After Fixes

| Step | Status |
|---|---|
| Page views | Pass |
| Product impression (card mount) | Pass — product_viewed with tenant context, env-gated |
| Product detail view | Pass — same event, same guard |
| Add to cart | Pass — explicit add_to_cart event |
| Cart updated | Pass — cart_updated, env-gated |
| Checkout started | Pass — checkout_started, env-gated |
| Order completed | Pass — order_completed, env-gated |
| GA4 purchase | Pass — gtag call unchanged (already browser-gated via window.gtag?.) |

## Files Changed

- src/lib/posthog.ts
- src/components/analytics/product-view-tracker.tsx
- src/components/analytics/order-complete-tracker.tsx
- src/components/store/cart-drawer.tsx
- src/components/store/checkout-form.tsx
- src/components/store/product-card.tsx
- src/components/store/add-to-cart-button.tsx
- src/app/(store)/shop/page.tsx
- src/app/(store)/shop/[slug]/page.tsx
- src/app/(store)/page.tsx
