# JH-012 Batch 1b — OpenCode Corrections (P0)

Read .doa/council/JH-012/opencode-validate.md (missing gaps G-79 through G-84).

## FIX G-79: Order Financial Fields
Add to Order model in schema:
- subtotal Int (minor units)
- shippingTotal Int (minor units, default 0)
These must exist alongside existing `total` for checkout, refunds, and reporting.

## FIX G-80: Order Payment Fields
Add to Order model:
- paymentProvider String? (STRIPE, KOMOJU, etc.)
- paymentMethod String? (card, paypay, konbini, bank_transfer)
- paymentId String? (provider's payment/charge ID)
- paymentStatus String? (PENDING, COMPLETED, FAILED, REFUNDED)
- paidAt DateTime?

## FIX G-81: Refund Provider Fields
Add to Refund model:
- providerRefundId String? (provider's refund ID)
- providerPaymentId String? (original payment ID for idempotency)
- failureReason String? (if refund fails)

## FIX G-82: Phone Field
Add to checkout form + Order model:
- phone String? on Order
- Include in address snapshot JSON
- Add phone input to checkout form

## FIX G-83: Address Key Bug
In customer order detail and confirmation — use `postalCode` consistently (not `postcode`).

## FIX G-84: Min Carrier Config
Add carrier config JSON to Tenant model or a new TenantCarrier model:
- At minimum: carrier enum, apiKey, originPostalCode, originAddress
- Enough for Ship&co label creation

## RULES
- Read existing files before editing
- Run npm run build after changes
- Write summary to .doa/council/JH-012/claude-implementation-batch1b.md
