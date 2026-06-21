Done: `.doa/council/JH-011/maker-synthesis.md`
Dienaba — Tokyo store owner, runs the business from her phone
Needs the fastest path to **sell, fulfill, and respond** with minimal taps.
- Mobile-first admin flow
- Japanese labels, addresses, and notifications
- Simple payment choices customers already trust
- Shipment creation + tracking without carrier complexity
- Clear order status and message visibility on mobile

### Aminata — customer in Japan, expects Japanese UX
Needs a checkout and post-purchase experience that feels native.
- Japanese language-first UI
- Local payment methods: PayPay, konbini, bank transfer
- JP postal/address auto-fill and validation
- Delivery updates in Japanese-friendly terms
- Trust signals: confirmations, tracking, and easy contact

### Tevin — developer/admin
Needs a maintainable implementation with low operational risk.
- Avoid dead-end APIs and unsupported carrier integrations
- Keep Stripe as the base, add Japan-specific providers cleanly
- Use typed wrappers and internal abstractions
- Add audit trails, permissions, and logs
- Respect tenant boundaries and currency correctness

## Synthesis

JH-011 should be framed as **Japan commerce readiness**, not just “add Japanese payments.” The real expansion is:

1. **Japanese checkout UX**
2. **Japan-native payment methods**
3. **Practical shipping automation**
4. **Operational controls for mobile-first business management**

## Core product decisions

### Payments
- **Remove LINE Pay** from scope entirely.
- Keep **Stripe** for cards and global methods.
- Add **KOMOJU** as the pragmatic Japan-specific layer for:
  - PayPay
  - konbini, including Seven-Eleven
  - bank transfer
  - Rakuten Pay
- Treat Japan Stripe methods as optional follow-up, not the foundation.

### Shipping
- Do **not** pursue direct Yamato/Sagawa/Japan Post integrations for JH-011.
- Use **Ship&co** as the single shipping abstraction for labels + tracking.
- Add carrier setup later only if volume justifies it.

### UX and localization
- Add **Japanese address/postal lookup** at checkout.
- Fix **JPY zero-decimal handling** immediately.
- Show order/payment/shipping statuses in a clear, mobile-friendly way.
- Make customer-facing communication usable in Japan from day one.

### Operations
- Add **status logs**, **order messages/notes**, and **email outbox logging**.
- Add **granular permissions** only where needed; keep owner/admin/employee flows simple.
- Build for **phone-first admin use**, because that is how Dienaba runs the store.

## Recommended scope for JH-011

### Must ship
- JPY display fix
- Japanese postal code lookup
- Order status audit trail
- Resend transactional emails
- KOMOJU integration
- Ship&co integration
- Order message thread + internal notes

### Should defer
- Direct carrier APIs
- Full granular permission system
- Deep automation beyond order/shipment lifecycle
- Japan Stripe payment methods if they slow the launch

## Final synthesis

If JH-011 succeeds, the platform will feel like:
- **easy to operate from a phone** for Dienaba,
- **normal and trustworthy in Japanese UX** for Aminata,
- and **stable, extensible, and auditable** for Tevin.

The best implementation path is to prioritize **local trust + operational simplicity**, not carrier or payment novelty.
