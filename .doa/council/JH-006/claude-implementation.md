Build was clean. JH-006 is complete. Here's the summary:

---

## JH-006 Done — Analytics & Tracking

**Build:** ✅ Clean — 0 errors, 0 type failures.

### What was built

**4 new files:**
- `src/lib/posthog.ts` — PostHog singleton with double-init guard
- `src/components/analytics/analytics-provider.tsx` — loads GA4 (gtag.js) + Clarity via `<Script strategy="afterInteractive">`, inits PostHog via `useEffect`; entirely no-ops outside `NODE_ENV=production`
- `src/components/analytics/product-view-tracker.tsx` — null-rendering client island, fires `product_viewed` on mount
- `src/components/analytics/order-complete-tracker.tsx` — null-rendering client island, fires `order_completed` (PostHog) + `purchase` (GA4) on mount

**7 files modified:**
- `layout.tsx` — `<AnalyticsProvider />` mounted once before `</body>`
- `product-card.tsx` — `<ProductViewTracker>` inserted as a client island; card itself stays a Server Component
- `shop/[slug]/page.tsx` — `<ProductViewTracker>` on the detail page
- `checkout-form.tsx` — `onSubmit` fires `checkout_started` before Stripe redirect
- `checkout/confirmation/page.tsx` — `<OrderCompleteTracker>` with order total + currency
- `cart-drawer.tsx` — initial load excluded from `cart_updated`; only fires on actual cart mutations
- `.env.example` — analytics var block appended

**Docs consulted:** `CLAUDE.md`, `CODING-STANDARDS.md`
dated on mutations only |
| `.env.example` | Added analytics vars block at the bottom |

---

## Event inventory

| Event | Tool | Fired from |
|-------|------|-----------|
| product_viewed | PostHog | ProductViewTracker (card + detail page) |
| cart_updated | PostHog | cart-drawer CART_EVENT listener |
| checkout_started | PostHog | checkout-form onSubmit |
| order_completed | PostHog + GA4 | OrderCompleteTracker on confirmation page |
| purchase | GA4 gtag | OrderCompleteTracker on confirmation page |
| page views | PostHog auto | posthog-js capture_pageview built-in |
| heatmaps / recordings | Clarity | Clarity script auto-capture |

---

## Environment variables required (production)

```
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_CLARITY_ID=xxxxxxxxxx
```

All are optional — the app runs normally without them (all analytics gated behind NODE_ENV === "production" and env var presence checks).

---

## Architecture decisions

- **Server Component cards stay server components.** ProductViewTracker is a null-rendering client island inserted inside the server shell — same pattern as AddToCartButton.
- **No double-init.** src/lib/posthog.ts tracks an initialized flag so HMR double-effects do not create duplicate PostHog instances.
- **Cart initial load excluded.** cart-drawer.tsx uses a separate initial() call (no tracking) vs sync() handler (fires cart_updated) so page load does not pollute the funnel.
- **checkout_started is client-side.** The form onSubmit fires before the server round-trip — the correct funnel moment.
