# JH-006 OpenCode Validation

## Verdict

Partial pass. The analytics scripts are installed and wired into the app, and the production build passes. The implementation does not fully satisfy the JH-006 tracking brief because several custom event emitters are not production/env-gated, `product_viewed` lacks tenant context, and there is no explicit add-to-cart event.

## Build

Command: `npm run build`

Result: Pass.

Notes:
- Prisma Client generated successfully.
- Next.js production build compiled successfully.
- Type/lint validation completed successfully.
- Static generation completed successfully.
- Warning only: `package.json#prisma` config is deprecated and should eventually move to `prisma.config.ts`.

## What Passed

- `src/components/analytics/analytics-provider.tsx` is a Client Component and uses `next/script` with `strategy="afterInteractive"` for GA4 and Clarity.
- Analytics provider is production-gated with `process.env.NODE_ENV === "production"`.
- GA4 script is gated behind `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
- Clarity script is gated behind `NEXT_PUBLIC_CLARITY_ID`.
- PostHog initializes through `src/lib/posthog.ts` only when `NEXT_PUBLIC_POSTHOG_KEY` exists and `window` is available.
- Root layout mounts `<AnalyticsProvider />` once in `src/app/layout.tsx`.
- `product_viewed` is emitted from product cards and product detail pages.
- `cart_updated` excludes the initial cart load and only fires from cart sync mutations/storage updates.
- `checkout_started` fires on checkout form submit before Stripe redirect.
- `order_completed` fires on the confirmation page with order id, value, currency, and item count.
- GA4 `purchase` fires from the confirmation page when `window.gtag` is available.
- `.env.example` documents PostHog, GA4, and Clarity public environment variables.

## Findings

### High: Custom PostHog events are not production/env-gated

Files:
- `src/components/analytics/product-view-tracker.tsx`
- `src/components/analytics/order-complete-tracker.tsx`
- `src/components/store/cart-drawer.tsx`
- `src/components/store/checkout-form.tsx`

The provider is production-gated, but the event calls are unconditional. In development, or in production without `NEXT_PUBLIC_POSTHOG_KEY`, these components still call `posthog.capture(...)` against the imported singleton. This does not match the implementation claim that analytics are entirely no-op outside production and env presence checks.

Recommended fix: expose a small `capturePostHogEvent` helper in `src/lib/posthog.ts` that checks production mode and key presence before calling `posthogJs.capture`, then use it for all custom events.

### Medium: `product_viewed` omits required tenant context

Files:
- `src/components/analytics/product-view-tracker.tsx`
- `src/components/store/product-card.tsx`
- `src/app/(store)/shop/[slug]/page.tsx`

JH-006 requires product views to include product name, category, price, and tenant. The current event includes product id, product name, category, price, and currency, but no tenant id/name/domain.

Recommended fix: pass tenant context from storefront pages/components into `ProductViewTracker` and include it in the event payload.

### Medium: No explicit add-to-cart event

File: `src/components/store/add-to-cart-button.tsx`

JH-006 requires PostHog to track the full user journey including add to cart. The implementation tracks `cart_updated` from `CartDrawer`, but there is no explicit `add_to_cart` event from the button click. `cart_updated` may be useful as a cart mutation signal, but it does not distinguish add, remove, and quantity changes.

Recommended fix: emit `add_to_cart` in `AddToCartButton.handleAdd()` with product id, name, price, currency if available, and quantity delta.

### Low: Product card tracking measures impressions more than product views

File: `src/components/store/product-card.tsx`

`ProductViewTracker` is mounted inside every product card, including related-product cards on the detail page. That means the `product_viewed` funnel may count catalog/card impressions and related-product impressions as product views. This follows the literal task note to fire on product-card mount, but it may make funnel analysis noisy.

Recommended fix: either rename the card event to `product_impression` and reserve `product_viewed` for detail pages, or keep the current behavior but add a `source` property such as `card`, `detail`, or `related`.

## Funnel Coverage

| Step | Status | Evidence |
| --- | --- | --- |
| Page views | Pass | PostHog `capture_pageview: true`; GA4 default `gtag('config', GA_ID)` |
| Product tracking | Partial | `product_viewed` exists but lacks tenant and may overcount impressions |
| Add to cart | Partial | `cart_updated` exists, but no explicit `add_to_cart` event |
| Cart updated | Pass | `cart-drawer.tsx` fires after cart mutation/storage sync, not initial load |
| Checkout started | Pass | `checkout-form.tsx` fires on submit |
| Order completed | Pass | `order-complete-tracker.tsx` fires PostHog `order_completed` |
| GA4 purchase | Pass | `order-complete-tracker.tsx` fires `gtag('event', 'purchase', ...)` |
| Clarity heatmaps/recordings | Pass | Clarity snippet loads after interactive when project id exists |

## Docs Consulted

- `.doa/council/JH-006/claude-implementation.md`
- `.doa/council/JH-006/01-task-data.md`
- `CODING-STANDARDS.md`
- `STYLE-GUIDE.md`
