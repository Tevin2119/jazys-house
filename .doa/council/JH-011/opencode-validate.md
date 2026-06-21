# JH-011 OpenCode Validation

## Verdict

Claude's investigation is directionally useful and catches several high-value blockers: LINE Pay Japan is out of scope, JPY zero-decimal handling is currently unsafe, direct Japan carrier APIs are poor JH-011 targets, and aggregator-first payments/shipping is the right default.

However, do not treat the schema section as implementation-ready. It under-models payment lifecycle, mixes order and shipment/payment states, omits several tenant/provider boundaries, and overstates the current auth/membership implementation.

## Validated Findings

- `LINE Pay Japan` should be removed from the Japan payment scope. Keeping it as a future Taiwan/Thailand note is fine, but not for Tokyo launch.
- `KOMOJU` is a credible Japan-payment aggregator path for PayPay, konbini including Seven-Eleven, bank transfer, Rakuten Pay, and other local methods. A typed internal client is needed because there is no established first-party npm package in the current repo.
- `Ship&co` is the pragmatic shipping integration candidate for JH-011 because direct Yamato/Sagawa/Japan Post integrations carry onboarding, contract, sandbox, or public-API blockers.
- Current Stripe checkout is server-side and tenant-fenced by metadata in `src/app/(store)/checkout/actions.ts` and `src/app/api/webhooks/stripe/route.ts`.
- The JPY bug is real, but bigger than Claude stated. `formatPrice()` divides by `100`, `toMinorUnits()` multiplies by `100`, product admin defaults divide by `100`, and analytics send `price / 100` / `total / 100`. A JPY launch requires a single currency exponent helper used by display, admin price parsing, analytics, Stripe unit amounts, imports, and migrations.

## Missed APIs / Market Options

- Payment aggregators missing from the comparison: `GMO Payment Gateway`, `SB Payment Service`, `VeriTrans`, `PAY.JP`, and `Paidy`. These may not beat KOMOJU for a small foreign-operated launch, but they are important Japan-market references and should be briefly assessed before final vendor lock-in.
- Shipping/tracking aggregators were compared mostly for carrier coverage, but the plan should separate label creation from tracking. `AfterShip`, `TrackingMore`, and similar services can be useful for tracking-only fallback even if Ship&co owns labels.
- Cash-on-delivery / Yamato Collect-style flows were not considered. If Dienaba wants Japan-local fulfillment norms, COD should be explicitly accepted or rejected because it affects payment state and shipment carrier selection.
- Address support should include Japanese postal-code normalization and address components, not only lookup. ZipCloud/offline lookup is a start, but checkout schema must handle prefecture, city/ward, chome/banchi/building, kana, and country-specific formats.

## Wrong Or Overstated Assumptions

- Current role support is overstated. `src/lib/auth.ts` only treats `SUPER_ADMIN` and `TENANT_ADMIN` as admin roles. `OWNER`, `ADMIN`, and `EMPLOYEE` currently cannot enter admin routes.
- `TenantMembership` exists in `prisma/schema.prisma`, but `src/auth.ts`, `getAdminContext()`, and `canAccessTenant()` still use `User.tenantId`. Cross-tenant roles are not actually enabled in runtime auth.
- The current Stripe webhook should not be the template for multi-provider idempotency. `Order.stripeEventId` stores only one event id and can be overwritten by different Stripe events. JH-011 needs a provider-agnostic `WebhookEvent` / processed-event table keyed by provider/account/event id.
- `PaymentMethod` is a misleading name for tenant-enabled payment options. In payment systems, a payment method often means a customer instrument. Prefer `TenantPaymentProvider`, `TenantPaymentOption`, or similar.
- `OrderStatus` should not absorb all fulfillment and payment concepts. `LABEL_CREATED` and `IN_TRANSIT` belong to shipment/fulfillment state. `REFUNDED` belongs to payment/refund state. Mixing them will make partial shipment, partial refund, cancelled-after-label, and paid-but-unfulfilled cases hard to represent.

## Tenancy Implications

- Every new model must have `tenantId`, tenant relations where practical, and indexes matching access paths. Claude's proposed models include `tenantId` on most rows, but omit relations, many indexes, and delete behavior.
- Provider credentials are tenant-scoped secrets. Do not store raw Ship&co/KOMOJU/Stripe credentials in plain JSON fields. Use encrypted storage or environment/provider indirection, and record which tenant/provider account received each webhook.
- Shared Stripe account plus metadata tenant fences can continue short-term, but KOMOJU and Ship&co require explicit tenant resolution from provider account ids, webhook endpoints, or signed metadata. Never resolve solely from an order id supplied in a webhook body.
- Public tracking pages must avoid exposing internal sequential-ish order identifiers as bearer access. Use signed tokens, customer auth, or email/postcode verification.
- Admin permission checks must be rewritten around memberships before adding `UserPermission`; otherwise OWNER/ADMIN/EMPLOYEE permissions will exist in schema but remain unreachable or inconsistent.

## Schema Proposal Corrections

- Add a payment record separate from `Order`: provider, provider payment id, method, amount, currency, status, expiresAt, capturedAt, refundedAmount, raw details as JSON, and `@@unique([provider, providerPaymentId])`.
- Add `WebhookEvent`: provider, providerAccountId or tenantId, eventId, eventType, receivedAt, processedAt, status, and raw payload hash. Use it for Stripe and KOMOJU idempotency.
- Use `TenantPaymentOption` instead of `PaymentMethod`, with provider, method type, enabled flag, display ordering, and optional per-method limits/currencies.
- Keep `Order.status` as customer/order orchestration state and add separate `paymentStatus` if needed. Keep shipment progress in `OrderShipment.status` / `ShipmentEvent`.
- `OrderShipment` should relate to `Order` and `Tenant`, index `[tenantId, orderId]`, uniquely identify provider shipment ids per provider, and support multiple parcels per order.
- `OrderStatusLog.changedBy` should be nullable or actor-typed for webhooks/system jobs, not only a user email string. Store `actorType`, `actorId`, and optional reason.
- `OrderMessage` and `OrderNote` should be separate or very explicit. A boolean `isPublic` is easy to misuse for privacy-sensitive customer/admin communication.
- `SentEmail` should include provider, provider message id, event status, template key/version, and idempotency key so retries do not double-send.
- `UserPermission` should attach to `TenantMembership` or be keyed through membership semantics, not just `userId + tenantId`, because a user's role is tenant-local.
- `ActivityLog.userId` should allow system/webhook actors and include `resourceType`, `resourceId`, and request/provider context.

## Implementation Priority Adjustments

1. Fix currency exponent handling globally before creating or importing JPY products.
2. Introduce provider-agnostic payment/webhook tables before KOMOJU.
3. Fix runtime membership/role handling before employee permissions.
4. Add order status audit logging before automatic transitions.
5. Add Ship&co behind a tenant-scoped shipping service, keeping labels and tracking separate.

## Docs Consulted

- `CODING-STANDARDS.md`
- `.doa/council/JH-011/claude-investigation.md`
- `.doa/council/JH-011/01-task-data.md`
- `prisma/schema.prisma`

## Repo Evidence Checked

- `src/lib/utils.ts`
- `src/lib/auth.ts`
- `src/auth.ts`
- `src/lib/order-status.ts`
- `src/app/(store)/checkout/actions.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/app/(admin)/admin/orders/actions.ts`
- `src/app/(admin)/admin/settings/actions.ts`
- `src/app/(admin)/admin/products/actions.ts`
