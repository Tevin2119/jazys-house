# Stripe Setup

Jazy's House uses a shared Stripe account. Each Checkout Session includes immutable `orderId` and `tenantId` metadata, while the database remains the source of truth for prices, currency, stock, and fulfillment state.

## Test setup

1. Put Stripe test values in the local `.env` using the corrected `.env.example` names:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
2. Run `npm run dev`.
3. In another terminal, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and use its displayed signing secret locally.
4. Complete a real test checkout with `4242 4242 4242 4242`.

The secret and webhook signing secret are server-only. Rotate them immediately if exposed.

## Required webhook events

Register the production endpoint at `https://<domain>/api/webhooks/stripe` and subscribe to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.expired`
- `checkout.session.async_payment_failed`
- `refund.updated`
- `charge.refunded`

The handler verifies Stripe's raw-body signature before database work. For a payment it also requires a stored matching Checkout Session, matching order and tenant metadata, `mode=payment`, `payment_status=paid`, matching amount/currency, and a PaymentIntent. Processed Stripe event IDs are persisted transactionally.

## Checkout contract

- Card payment is the only enabled method. Do not enable other Stripe methods until their asynchronous payment lifecycle is covered by tests and support operations.
- Browser prices and cart totals are ignored. Products are re-read and repriced from the tenant-scoped database.
- Each browser checkout supplies one high-entropy attempt ID; it is unique in the database and reused as Stripe's idempotency key.
- Stock is reserved atomically and released only after a conditional pending-order cancellation.
- The confirmation page accepts only Stripe's opaque Checkout Session ID, never an internal order ID.
- Shipping is currently free. Do not advertise calculated or paid shipping until an authoritative rate service is implemented.

## Refunds

Refund records move from requested to approved. Advancing an approved refund calls Stripe with a stable idempotency key and records Stripe's refund/payment IDs. `charge.refunded` reconciles the final local state. Never mark a refund completed manually.

## Live launch checklist

1. Use a separate production Stripe endpoint/signing secret and Vercel Production variables.
2. Confirm all required webhook event deliveries are successful.
3. Perform one low-value live payment/refund under the approved launch procedure.
4. Verify payment, fulfillment, and refund records reconcile in Stripe and the admin dashboard.
