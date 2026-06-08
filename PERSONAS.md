# User Personas

## Jazy's House Platform Personas

---

### Dienaba — Store Owner (Admin)

**Who:** The owner of Jazy's House. Runs an African fashion, superfoods, and catering business. Hands-on — she's the curator, the chef, the customer service rep. Moderate technical ability; learns by doing, no time for complexity. Manages product photography, inventory, orders, and catering inquiries herself.

**Primary goals:**
- Showcase handmade African fashion and superfoods beautifully online
- Sell products with minimal friction — smooth checkout, clear pricing
- Manage multiple storefronts (fashion vs food vs future brands) from one dashboard
- Accept catering bookings and inquiries seamlessly
- Grow the brand through social media and word of mouth
- Spend more time creating and less time doing admin

**Key frustrations (design for these):**
- **Product management friction:** Adding products must be fast — image upload, pricing, category. If it takes more than 2 minutes per product, she won't add them all.
- **Order visibility:** Needs to see new orders immediately. Notification anxiety — "did someone order something while I was cooking?"
- **Theme simplicity:** Wants the store to look beautiful but shouldn't need a designer. Good defaults, simple customization.
- **Catering inquiry management:** Inquiries come in but get lost in email. Need them organized in one place with clear status.
- **Inventory chaos:** Selling across fashion, food, and home decor — categories must be clear and products easy to find in the admin.
- **Payment anxiety:** Is Stripe working? Did the payment go through? Clear payment status and quick refund capability.

**Design implications:**
- Desktop-primary for admin (product uploads, order management)
- Mobile for quick checks (new order notifications, inquiry responses)
- Fast product upload flow: drag-and-drop images, quick category assignment
- Clear order pipeline: New → Processing → Shipped → Delivered
- Simple theme editor: colors, logo, hero image — nothing intimidating
- Tenant switcher: dropdown in admin header to toggle between storefronts

---

### Aminata — Customer (Storefront User)

**Who:** Ages 20-55. Interested in African fashion, culture, and food. May be African diaspora looking for authentic products, or someone discovering African craft for the first time. Primarily mobile. Values authenticity and craftsmanship. Wants to know the story behind what she's buying.

**Primary goals:**
- Find beautiful, authentic African fashion and accessories
- Discover new African superfoods and pantry items
- Smooth, trustworthy checkout experience
- Feel connected to the brand and its story
- Share purchases on social media

**Key frustrations (design for these):**
- **Slow mobile experience:** Browsing on phone must be fast and beautiful. Product images load quickly, navigation is thumb-friendly.
- **Trust:** Is this real? Detailed product descriptions, clear photos, transparent shipping info.
- **Checkout friction:** Too many steps = abandoned cart. Stripe Checkout or Apple Pay — one tap if possible.
- **Where's my order?:** Post-purchase anxiety. Clear order confirmation and tracking.
- **Can't find products:** Good search, clear categories, filtering by size/price/color.

**Design implications:**
- **Mobile-first, mobile-primary** — design every customer-facing screen for phone screens
- Large, beautiful product images with zoom
- Fast checkout: Stripe Checkout (hosted) or embedded with Apple Pay / Google Pay
- Product stories: brief "crafted by" or "from" context on each product card
- Instagram/TikTok social proof embedded on storefront
- PWA: installable on home screen, works offline for browsing

**Customer journey priority:**
1. Browse products (images first, text second)
2. Add to cart (quick, visual feedback)
3. Checkout (fewest steps possible)
4. Order tracking (clear status updates)
5. Re-discover (email newsletter, social media)

---

### Tevin — Platform Admin / Developer (Super Admin)

**Who:** Technical owner who built the platform. Manages infrastructure, deploys updates, onboards new tenants. Deep technical ability. Wants system to run itself once configured.

**Primary goals:**
- Deploy and forget — the platform should be stable with minimal intervention
- Add new storefronts quickly (new tenant = new row in DB + theme config)
- Monitor health: uptime, error rates, payment failures
- Delegated implementation to the council (Hermes → Claude → OpenCode)

**Key frustrations:**
- **Config drift:** Settings spread across env vars, DB, and code. Single source of truth.
- **Deployment fear:** Every deploy touches multiple storefronts. Rollback must be instant.
- **Stripe complexity:** Multi-tenant Stripe (Connect or multiple API keys). Must be clean.

**Design implications:**
- Infra-as-code: everything in this repo, deployed via Vercel
- Tenant creation: API endpoint or admin UI, not manual DB inserts
- Monitoring: Vercel Analytics + Stripe dashboard
- Rollback: Vercel instant rollback per deployment
