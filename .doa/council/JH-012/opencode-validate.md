# OpenCode Validation — JH-012 Gap Analysis

## Verdict

The gap analysis is directionally correct and matches the standalone admin template on the major missing areas: fulfillment statuses, refunds, communications, integrations, employees, shipping/carriers, Japanese checkout, KOMOJU, metrics, catering detail, mobile overflow navigation, and i18n.

However, it understates several launch-critical dependencies and overstates one existing address-storage gap. The main correction is that Japan launch is not just "add KOMOJU + address fields"; it also needs shipping charge persistence, payment/refund reconciliation fields, carrier/integration prerequisites for label creation, and safer migration ordering.

## Critical Omissions

| Missing Gap | Priority | Why it matters |
|---|---:|---|
| Persist shipping charges on `Order` and include shipping as an actual checkout/payment line item | P0 | The template shows subtotal, shipping, and total in checkout, order detail, refunds, and customer confirmation. Current checkout stores only `total` from product lines and tells users "Shipping calculated after checkout." This blocks accurate Japanese checkout, refunds, AOV, and accounting. |
| Store payment provider, payment method, transaction/payment IDs, and payment status as first-class order fields | P0 | G-72 is marked P1 for reporting only, but template uses PayPay/KOMOJU/Stripe transaction details in order detail, history, refunds, and payment status. Without this, support and refunds cannot reconcile payments safely. |
| Gateway refund execution and idempotency model | P0 | Refunds are not just a local `Refund` row and status pipeline. Stripe and KOMOJU refunds need provider refund IDs, original payment IDs, webhook/event IDs, failure states, retries, and partial refund totals. |
| Shipping/label integration prerequisites for P0 label creation | P0/P1 | G-21 is P0, but G-39 Ship&co and G-58/G-59 carrier settings are P1. A real "Create label" flow depends on credentials, origin address, carrier enablement, package data, and API response handling. Either promote the minimum Ship&co/carrier config slice or downgrade label creation to mock/manual. |
| Phone number in checkout/order address snapshot | P0 | Template order/customer data consistently includes phone. Current checkout has no phone field. Japanese carriers commonly require phone for labels. |
| Checkout address key compatibility bug | P0 bug | Current checkout stores `{ line1, city, postcode, country }`, but customer order detail formats `postalCode`, not `postcode`. Existing orders will render without postal code until normalized or formatter is fixed. |
| Order financial breakdown fields | P0 | Template requires item subtotal, shipping, total, refund amount, and payment method. Current `Order` only has `total`; reconstructing later from items will be brittle once shipping, discounts, partial refunds, or taxes exist. |

Recommended new gaps:

| # | Gap | P | Effort |
|---|---|---:|---:|
| G-79 | Add `shippingTotal`/`subtotal` fields or equivalent financial snapshot to `Order`; include shipping in Stripe/KOMOJU checkout and confirmations | P0 | M |
| G-80 | Add order payment fields: provider, method, provider payment ID, payment status, paidAt | P0 | M |
| G-81 | Add refund provider execution/idempotency fields and webhook-safe refund lifecycle | P0 | L |
| G-82 | Add checkout phone field and persist it in address/contact snapshot | P0 | S |
| G-83 | Fix/normalize address keys used by customer order detail (`postcode` vs `postalCode`) | P0 | XS |
| G-84 | Minimum carrier credential/origin-address config required before label creation | P0/P1 | M |

## Wrong Or Risky Priorities

| Gap | Current | Recommended | Rationale |
|---|---:|---:|---|
| G-72 payment method on Order | P1 | P0 | Needed for checkout confirmation, order detail, refunds, history, payment support, and KOMOJU reconciliation, not just reporting. |
| G-37 Integration model | P1 | P0/P1 split | Full integration hub can remain P1, but payment/shipping credential storage required by KOMOJU/Ship&co should be part of P0 or an explicit prerequisite. |
| G-39 Ship&co integration | P1 | P0 if G-21 remains P0 | Label creation cannot be production-safe without the shipping provider integration. |
| G-58/G-59 Carrier config/settings | P1 | P0/P1 split | Minimum origin address/carrier credentials are required for labels; the polished settings UI can remain P1. |
| G-68 structured address storage | P0 | Reframe as P0 normalization, not greenfield | `Order.address` is already JSON and checkout already stores a structured object. The gap is Japanese schema completeness and consistent keys, not "not raw text." |
| G-30 messages schema / G-31 inbox | P1 | P1 is acceptable | Useful for template parity and customer anxiety, but not strictly payment/fulfillment launch-critical if email support remains available. |
| G-44 invite employee flow | P1 | P2 unless operationally required | Tenant-scoped employee listing/roles matter, but invite flow is not implied as launch-critical by the template. |
| G-75 i18n infrastructure | P2 | P1 for checkout/status strings, P2 for full app | The template is bilingual throughout. Full `next-intl` can wait, but Japan checkout/status labels should not. |

## Estimate Corrections

| Gap / Area | Current estimate | Corrected estimate | Reason |
|---|---:|---:|---|
| G-38/G-69 KOMOJU integration | XL, described as 2-5d | XL+, closer to 1-2 weeks for production | Requires payment method selection, session/payment creation, webhook handling, async methods like konbini/bank transfer, cancellation/expiry states, provider IDs, reconciliation, and tests. |
| G-25 Refund schema | S | M | Needs provider IDs, payment linkage, idempotency, partial refund totals, failure states, actor/audit fields, and tenant scoping. |
| G-27 Refund review modal | M | L if it executes real refunds | Approve/deny UI is M, but gateway execution, validation, async provider states, and audit history make it L. |
| G-21 Create Label flow | L | XL unless mocked/manual | Real labels require carrier config, package dimensions, Ship&co/API integration, error handling, shipment persistence, and tracking events. |
| G-22 Shipment timeline | M | M/L | If fed manually, M. If provider tracking sync is expected, L. |
| G-36 Integration credential editor | L | L/XL | Encrypted credential storage, masking, testing, rotation, and tenant isolation are security-sensitive. |
| G-75 i18n infrastructure | XL | Correct | But a scoped checkout/status bilingual layer can be M and should precede full conversion. |
| P0 total | 3-4 weeks | 5-7 weeks for one dev | The current estimate excludes payment/refund/shipping dependencies and production hardening. |

## Missed Non-Critical Gaps

| Missing Gap | Priority | Notes |
|---|---:|---|
| Customer list location column and richer customer identity snapshot | P2 | Template customer table has location, orders, lifetime value, avatar initials. Current `/admin/customers` only groups by name/email/orders/spend. |
| Query Builder results wired into metrics/chart widgets | P2 | Template says "plug it into a metric chart." Current query builder exists but gap analysis only covers metrics charts, not saved query to chart integration. |
| Notification badge/system | P2 | Template mobile admin header has a notification bell badge. Gap analysis covers nav badges but not a unified notification source. |
| Currency display switcher | P2 | Template has JPY/GBP/USD/EUR display switching. Current system uses tenant currency only. This is not launch-blocking for Japan if JPY is fixed. |
| Mobile customer confirmation screen parity | P2 | Template includes a post-order confirmation state with a direct tracking CTA. Current confirmation exists, but parity with Japanese mobile flow should be checked. |
| Staff assignment should reference tenant employees | P1/P2 | Catering `staffId` is listed, but implementation needs linkage to `TenantMembership`/employees and permissions. |

## Overstated Or Incorrect Claims

| Claim | Correction |
|---|---|
| G-68 says structured address storage is missing | Partially wrong. `Order.address` is already `Json`, and checkout stores structured keys. The missing part is Japan-specific completeness: postal, prefecture, line1/line2, kana, phone, and consistent key names. |
| G-53 lists `countdown` as a schema field | Countdown should be computed from event date/time, not stored. The missing stored field is event time/datetime and venue; countdown is UI logic. |
| P0 KOMOJU risk says "2-5d" | Underestimated for a production-safe Japanese payment rollout. |
| G-08 nav additions marked XS | Route links are XS, but useful entries depend on authorization, routes, badges, empty states, and mobile overflow. As standalone nav-only work it is XS; as user-visible complete navigation it is S/M. |

## Validation Against Template Sections

The standalone template contains these major sections: Dashboard, Orders List, Order Detail, Refunds, Messages/Comms, Catering, Catering Detail, Customers, Employees, Employee Detail, Metrics, Query Builder, Integrations, Integration Detail, Shipping & Carriers, Customer Realm, Mobile Admin, Mobile Customer.

The gap analysis covers almost all of those sections. It correctly does not spend time on Product/Category admin parity because the template does not include product/category admin sections.

## Recommended P0 Cut

For a realistic Japan-launch P0, keep the scope tight but include the hidden dependencies:

1. Japanese checkout/contact snapshot: postal, prefecture, city, address lines, kana, phone, consistent address keys.
2. Payment foundation: order payment provider/method/status/IDs, KOMOJU create-payment flow, webhooks, async payment states.
3. Financial snapshot: subtotal, shipping total, total, currency, payment/refund linkage.
4. Order status expansion: LABEL, TRANSIT, REFUNDED plus filters/badges/state machine.
5. Minimum fulfillment: carrier/origin config, shipment model, either real Ship&co labels or explicitly manual/mock labels.
6. Refund foundation: refund model with provider IDs/idempotency, review UI, provider execution, REFUNDED status only when appropriate.
7. Customer tracking baseline: timeline from order/shipment status, because the template and customer persona both center post-purchase anxiety.

## Docs Consulted

- `.doa/council/JH-012/gap-analysis.md`
- `C:/Users/Tevin/Downloads/Jazys House Admin (standalone) (1).html`
- `STYLE-GUIDE.md`
- `PERSONAS.md`
