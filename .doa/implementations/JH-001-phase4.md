# JH-001 Phase 4 — Payments (Stripe Checkout + Webhooks)

**Status:** ✅ Implemented · `npm run build` green · `npx tsc --noEmit` clean
**Date:** 2026-06-07

End-to-end Stripe Checkout: server-side re-priced orders, atomic stock,
signature-verified idempotent webhooks, admin payment visibility, and the H1/H2
council fixes.

---

## Files changed

| File | Change |
|---|---|
| `src/app/(store)/checkout/actions.ts` | `placeOrder` rewritten — re-price → atomic order+stock txn → Stripe session → return `{ url }`; compensating cancel/restock on failure |
| `src/components/store/checkout-form.tsx` | Redirects the browser to `state.url` (Stripe); cart cleared post-payment, not on submit |
| `src/app/api/webhooks/stripe/route.ts` | **New.** Signature verification, `checkout.session.completed`, idempotency, tenant fence, `checkout.session.expired` restock |
| `src/app/(store)/checkout/confirmation/page.tsx` | Looks up by `session_id` (tenant-scoped), redirects to `/cart` if not found, shows live status |
| `src/app/(admin)/admin/orders/[id]/page.tsx` | Payment badge, Stripe session link, fulfilment gated on payment |
| `src/app/(admin)/admin/orders/actions.ts` | **H1** compare-and-swap status update + unpaid-order gate |
| `prisma/schema.prisma` | `stripeEventId` now `@unique` (DB-level webhook idempotency); dropped redundant index |

---

## Task checklist

- **4a — Checkout session:** ✅ `verifyCart` re-prices every line from the DB; client prices ignored. Order + `OrderItem`s created in one transaction with `tenantId` on both, price snapshots, `PENDING`. Stripe session built from verified items with `metadata: { orderId, tenantId }`, `success_url=…/confirmation?session_id={CHECKOUT_SESSION_ID}`, `cancel_url=/cart`. `stripeSessionId` stored; `{ url }` returned for client redirect.
- **4b — Webhook:** ✅ `constructEvent` verifies the raw body against `STRIPE_WEBHOOK_SECRET`. `checkout.session.completed` → looks up order, fences tenant, `PENDING → PROCESSING`. `payment_failed` / `charge.refunded` stubbed (logged). `checkout.session.expired` releases reserved stock.
- **4c — Confirmation:** ✅ `session_id` → tenant-scoped order lookup; `/cart` redirect when absent; live status note; `ClearCart` on mount.
- **4d — Admin order:** ✅ Payment badge (Paid / Awaiting / None), Stripe dashboard link, and an **unpaid order cannot be advanced to PROCESSING** (UI-filtered *and* enforced in the action).
- **4e — H1 (status race):** ✅ `updateMany({ where: { id, tenantId, status: current }, … })` + `count === 1` check → conflict error on a lost race.
- **4f — H2 (stock oversell):** ✅ Interactive transaction; each line is a conditional `updateMany({ where: { …, stock: { gte: quantity } }, data: { decrement } })` with `count === 1` check; any short line throws → full rollback. Atomic, never check-then-write.
- **4g — Idempotency:** ✅ Skips if `stripeEventId` already recorded; CAS transition prevents double-apply; `@unique` on `stripeEventId` is the DB backstop.
- **H3 (user email uniqueness):** ✅ Already enforced by `User.email @unique`; no payment code path creates users, so nothing to change this phase.

---

## Hardening applied from guardian review

Both `payments-guardian` and `tenancy-guardian` reviewed the diff (core model PASS). Applied:

1. **Webhook tenant fence fails closed** — a missing/mismatched `metadata.tenantId` now throws instead of short-circuiting.
2. **Order↔session divergence healed** — if `stripeSessionId` was never persisted (process died mid-checkout), the webhook falls back to `metadata.orderId`, processes the payment, and backfills the session id. Prevents "customer paid, order stuck PENDING."
3. **`stripeEventId @unique`** — promotes idempotency from app-level assumption to DB guarantee.
4. **`checkout.session.expired` handler** — releases stock locked by abandoned checkouts (closes a stock-leak in the H2 story).
5. **Tenant-scoped `stripeSessionId` write** — `updateMany` with `tenantId` guard for consistency with the tenant-first rule.

---

## Deviations / notes for the user

- **Webhook response codes:** returns **200** for every validly-signed event (handled *and* intentionally ignored), **400** only for a missing/invalid signature, **500** for retryable processing errors. This is the correct Stripe contract — returning 4xx for an unhandled *type* makes Stripe retry it for ~3 days. (Task wording said "400 for unhandled"; implemented the safe behavior instead.)
- **Schema change needs applying:** `stripeEventId @unique` requires `npx prisma db push` (or a migration) against the DB. The Prisma client has been regenerated locally.
- **Env vars:** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` must hold real values. Local webhook testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

## Known follow-ups (not blocking)

- `payment_intent.payment_failed` / `charge.refunded` are logged stubs — wire to order cancellation / refund accounting when needed.
- Consider a DB-level `(tenantId, productId)` constraint on `OrderItem` to make cross-tenant product attachment impossible at the schema layer (currently enforced in app code via `verifyCart`).

## Verification

```
npx prisma generate   # ✓
npx tsc --noEmit      # ✓ clean
npm run build         # ✓ /api/webhooks/stripe route registered
```
