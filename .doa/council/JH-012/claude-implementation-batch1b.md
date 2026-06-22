Build passed clean. All 6 gaps are done. Summary:

**G-79** — `subtotal Int @default(0)` + `shippingTotal Int @default(0)` on `Order`. Checkout action now computes both and persists them (currently `shippingTotal=0`, `subtotal=verified.total`).

**G-80** — Five payment fields added to `Order`: `paymentProvider`, `paymentMethod`, `paymentId`, `paymentStatus`, `paidAt`. All nullable; populated by webhook handlers.

**G-81** — Three provider fields on `Refund`: `providerRefundId`, `providerPaymentId` (idempotency key), `failureReason`.

**G-82** — `phone String?` on `Order`. Added optional `type="tel"` input to checkout form. Stored as top-level field and in address snapshot JSON.

**G-83** — Fixed the `postcode`/`postalCode` mismatch. The form input and server action now use `postalCode`, matching what `formatAddress` in the order detail page already expected. Existing orders with `postcode` in their JSON will need a one-time SQL migration (noted in summary).

**G-84** — New `TenantCarrier` model with `carrier`, `apiKey`, `originPostalCode`, `originAddress`, `enabled`. One record per carrier per tenant (`@@unique([tenantId, carrier])`). `Tenant` model has the `carrierConfigs` relation.

**Migration to run:** `npx prisma migrate dev --name jh012-batch1b-financial-payment-carrier`
D for idempotency on re-submission
- `failureReason String?` — populated if provider refund execution fails

---

### G-82: Phone Field
**Files:**
- `prisma/schema.prisma` — `Order` model: added `phone String?`
- `src/components/store/checkout-form.tsx` — added optional phone input (`type="tel"`, no `required`)
- `src/app/(store)/checkout/actions.ts` — extracts `phone` from formData, stores as `Order.phone` and includes in address snapshot JSON

Phone is optional (String?) — Japanese carriers require it for label creation but it must not block checkout for non-Japanese stores.

---

### G-83: Address Key Bug Fix
**Files:**
- `src/components/store/checkout-form.tsx` — renamed input `name="postcode"` → `name="postalCode"`, placeholder updated
- `src/app/(store)/checkout/actions.ts` — renamed variable `postcode` → `postalCode`, updated address snapshot from `{ line1, city, postcode, country }` → `{ line1, city, postalCode, country, ...(phone && { phone }) }`

Customer order detail page at `src/app/(store)/orders/[id]/page.tsx` already used `a.postalCode` in its `formatAddress` helper — it was correct, the checkout was the bug.

**Note on existing orders:** Orders created before this fix have `postcode` in their address JSON. The `formatAddress` function reads `postalCode` and will silently omit the postal code for those rows. A one-time data migration (`UPDATE orders SET address = jsonb_set(address, '{postalCode}', address->'postcode') - 'postcode'`) would fix historical rows — out of scope for this batch.

---

### G-84: Min Carrier Config
**File:** `prisma/schema.prisma`

Added `TenantCarrier` model:
- `id, tenantId, carrier (CarrierType enum), apiKey String?`
- `originPostalCode String?, originAddress Json?`
- `enabled Boolean @default(false), createdAt, updatedAt`

Unique constraint on `[tenantId, carrier]` — one config per carrier per tenant.
Added `carrierConfigs TenantCarrier[]` relation to `Tenant` model.

`apiKey` must be encrypted at rest before the Ship&co integration is built.

---

## Pre-existing Bug Fixed
**File:** `prisma/seed-orders.ts`

Added explicit type annotations to `.reduce()` and `.map()` callbacks to fix `noImplicitAny` errors that were blocking `next build`.

---

## Migration Required
Before deploying, run:
```
npx prisma migrate dev --name jh012-batch1b-financial-payment-carrier
```

`@default(0)` on `subtotal`/`shippingTotal` ensures existing `Order` rows get valid values. New `TenantCarrier` table is empty until configured. All payment fields are nullable — non-breaking for existing rows.

## Docs Consulted
- `prisma/schema.prisma`
- `src/components/store/checkout-form.tsx`
- `src/app/(store)/checkout/actions.ts`
- `.doa/council/JH-012/opencode-validate.md`
