# JH-006 — Claude Code: Analytics & Tracking Implementation

You are Seat 1 (Workhorse Kang). Add all three analytics tools to the Jazy's House Platform.

## CONTEXT
- Next.js 15 App Router
- Multi-tenant e-commerce (African fashion/food)
- Budget: free tiers only
- Privacy: no cookie banners needed (all three are privacy-compliant)

## FIX 1: Analytics Provider Component
Create src/components/analytics/analytics-provider.tsx (Client component):
- Single client component that loads all three scripts
- Use Next.js `<Script>` component with `strategy="afterInteractive"`
- Reads IDs from environment variables (NEXT_PUBLIC_*)
- Only loads in production (process.env.NODE_ENV === "production")

## FIX 2: PostHog — Full User Journey
- Install: `npm install posthog-js`
- Create src/lib/posthog.ts — PostHog client initialization
- Track: page views (auto-capture), product views, add to cart, checkout start, order complete
- Add custom events to product-card.tsx (product_viewed on mount), cart-drawer.tsx (cart_updated), checkout actions (checkout_started, order_completed)
- PostHog ID: NEXT_PUBLIC_POSTHOG_KEY + NEXT_PUBLIC_POSTHOG_HOST
- Add to .env.example with placeholder values

## FIX 3: Google Analytics 4 — SEO & Audiences
- Google tag (gtag.js) script in analytics-provider
- GA4 measurement ID: NEXT_PUBLIC_GA_MEASUREMENT_ID
- Track: page views (default), purchase events, sign-ups
- Add to .env.example

## FIX 4: Microsoft Clarity — Heatmaps & Recordings
- Clarity script in analytics-provider
- Clarity project ID: NEXT_PUBLIC_CLARITY_ID
- Auto-captures: heatmaps, session recordings, rage clicks, dead clicks
- Add to .env.example

## FIX 5: Wire to Root Layout
- Import AnalyticsProvider in src/app/layout.tsx
- Mount it once in the root layout (before closing body)
- All pages automatically tracked

## FIX 6: Product View Tracking
- Add PostHog product_viewed event to src/components/store/product-card.tsx
- Fire on mount (useEffect) with product name, category, price, tenant
- Also fire on product detail page (shop/[slug]/page.tsx)

## FIX 7: Conversion Funnel Tracking
- src/app/(store)/checkout/actions.ts: track checkout_started
- src/app/(store)/checkout/confirmation/page.tsx: track order_completed with order value, currency, items count

## RULES
- Read existing files before editing
- Run npm run build after all changes
- All analytics IDs gated behind env vars — app works without them
- Write summary to .doa/council/JH-006/claude-implementation.md
