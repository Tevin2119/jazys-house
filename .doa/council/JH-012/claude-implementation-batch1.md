All 6 migrations are complete. Here's what was done:

---

## Batch 1 Summary

**M1 — OrderStatus expansion** (`prisma/schema.prisma`, `src/lib/order-status.ts`)
- Added `LABEL_CREATED`, `IN_TRANSIT`, `REFUNDED` to the enum
- State machine: `PENDING → PROCESSING → LABEL_CREATED → SHIPPED → IN_TRANSIT → DELIVERED`, CANCEL allowed from first 3, REFUNDED terminal from DELIVERED or CANCELLED

**M2 — OrderStatusLog** (schema + `src/lib/order-queries.ts`)
- Audit trail with `oldStatus?`, `newStatus`, `changedBy`, `reason`
- `getStatusHistory(orderId)` query helper added

**M3 — OrderMessage** (schema + `src/lib/order-queries.ts`)
- `MessageSide` enum (CUSTOMER/STORE), `isInternal` flag for yellow-bg admin notes
- `getOrderMessages(orderId)` query helper added

**M4 — Shipment + ShipmentEvent** (schema)
- `CarrierType` enum (YAMATO/SAGAWA/JAPAN_POST/OTHER)
- Parent/child: Shipment → ShipmentEvent timeline events

**M5 — Refund** (schema)
- `RefundStage` enum (REQUESTED→APPROVED→PROCESSING→COMPLETED)
- Uses Restrict on orderId (financial record, survives order deletion)

**M6 — JPY fix** (`src/lib/utils.ts`, `products/actions.ts`)
- `ZERO_DECIMAL_CURRENCIES` set for JPY/KRW/VND
- `formatPrice` and `toMinorUnits` skip the ÷100/×100 for those currencies
- `products/actions.ts` now fetches `tenant.currency` before converting prices

**Next step:** Apply the SQL from `claude-implementation-batch1.md` in the Supabase SQL editor, then run `npx prisma generate` (stop dev server first to release the DLL lock).

**Docs consulted:** `prisma/schema.prisma`, `src/lib/order-status.ts`, `src/lib/utils.ts`, `src/app/(admin)/admin/products/actions.ts`, `.doa/council/JH-012/gap-analysis.md`
t`, `→ events`
- `ShipmentEvent`: `id`, `shipmentId`, `status`, `location`, `description`, `timestamp`
- Indexes: `(orderId)`, `(tenantId)` on Shipment; `(shipmentId)` on ShipmentEvent

New enum: `CarrierType { YAMATO, SAGAWA, JAPAN_POST, OTHER }`

### M5 — Refund

New model in schema: `Refund`
- Fields: `id`, `orderId`, `tenantId`, `amount` (Int, minor units), `reason`, `stage` (RefundStage enum), `method`, `createdAt`
- Stage machine: REQUESTED → APPROVED → PROCESSING → COMPLETED
- Indexes: `(orderId)`, `(tenantId, stage)`

New enum: `RefundStage { REQUESTED, APPROVED, PROCESSING, COMPLETED }`

### M6 — JPY Currency Fix

**`src/lib/utils.ts`**:
- Added `ZERO_DECIMAL_CURRENCIES = Set(["jpy", "krw", "vnd"])`
- `formatPrice(minorUnits, currency, locale)`: divides by 1 (not 100) for zero-decimal currencies
- `toMinorUnits(majorUnits, currency)`: skips x100 for zero-decimal currencies; backward-compatible (defaults to "gbp")

**`src/app/(admin)/admin/products/actions.ts`**:
- `parseProductForm` now accepts `currency` parameter
- `createProduct` and `updateProduct` each fetch `tenant.currency` before calling `parseProductForm`, so JPY product prices are stored correctly

All existing `formatPrice` call sites already pass `currency` from `order.currency` / `tenant.currency` — they benefit automatically with no code changes needed at those sites.

---

## Migration SQL Required (apply via Supabase SQL editor)

DO NOT run `prisma db push` — DIRECT_URL is broken. Apply this SQL manually:

```sql
-- M1: Extend OrderStatus enum
ALTER TYPE "OrderStatus" ADD VALUE 'LABEL_CREATED' AFTER 'PROCESSING';
ALTER TYPE "OrderStatus" ADD VALUE 'IN_TRANSIT' AFTER 'SHIPPED';
ALTER TYPE "OrderStatus" ADD VALUE 'REFUNDED' AFTER 'CANCELLED';

-- M3: MessageSide enum
CREATE TYPE "MessageSide" AS ENUM ('CUSTOMER', 'STORE');

-- M4: CarrierType enum
CREATE TYPE "CarrierType" AS ENUM ('YAMATO', 'SAGAWA', 'JAPAN_POST', 'OTHER');

-- M5: RefundStage enum
CREATE TYPE "RefundStage" AS ENUM ('REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED');

-- M2: OrderStatusLog
CREATE TABLE "OrderStatusLog" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "oldStatus" "OrderStatus",
  "newStatus" "OrderStatus" NOT NULL,
  "changedBy" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderStatusLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OrderStatusLog_orderId_createdAt_idx" ON "OrderStatusLog"("orderId", "createdAt");
CREATE INDEX "OrderStatusLog_tenantId_idx" ON "OrderStatusLog"("tenantId");
ALTER TABLE "OrderStatusLog" ADD CONSTRAINT "OrderStatusLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderStatusLog" ADD CONSTRAINT "OrderStatusLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- M3: OrderMessage
CREATE TABLE "OrderMessage" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "side" "MessageSide" NOT NULL,
  "senderName" TEXT NOT NULL,
  "isInternal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OrderMessage_orderId_createdAt_idx" ON "OrderMessage"("orderId", "createdAt");
CREATE INDEX "OrderMessage_tenantId_idx" ON "OrderMessage"("tenantId");
ALTER TABLE "OrderMessage" ADD CONSTRAINT "OrderMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderMessage" ADD CONSTRAINT "OrderMessage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- M4: Shipment
CREATE TABLE "Shipment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "carrier" "CarrierType" NOT NULL,
  "trackingNumber" TEXT,
  "labelUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Shipment_orderId_idx" ON "Shipment"("orderId");
CREATE INDEX "Shipment_tenantId_idx" ON "Shipment"("tenantId");
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- M4: ShipmentEvent
CREATE TABLE "ShipmentEvent" (
  "id" TEXT NOT NULL,
  "shipmentId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "location" TEXT,
  "description" TEXT,
  "timestamp" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ShipmentEvent_shipmentId_idx" ON "ShipmentEvent"("shipmentId");
ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- M5: Refund
CREATE TABLE "Refund" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "reason" TEXT,
  "stage" "RefundStage" NOT NULL DEFAULT 'REQUESTED',
  "method" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Refund_orderId_idx" ON "Refund"("orderId");
CREATE INDEX "Refund_tenantId_stage_idx" ON "Refund"("tenantId", "stage");
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

## Files Changed

| File | Change |
|------|--------|
| `prisma/schema.prisma` | +LABEL_CREATED/IN_TRANSIT/REFUNDED to OrderStatus; +4 new enums; +4 new models; back-relations on Order + Tenant |
| `src/lib/order-status.ts` | Updated ORDER_STATUSES array + allowedNextStatuses() for 8-status graph |
| `src/lib/order-queries.ts` | NEW — getStatusHistory(), getOrderMessages() |
| `src/lib/utils.ts` | formatPrice + toMinorUnits zero-decimal currency support |
| `src/app/(admin)/admin/products/actions.ts` | parseProductForm + create/update actions pass tenant.currency to toMinorUnits |

---

## Notes

- `prisma generate` updated TS types successfully. The DLL replacement step failed due to Windows file lock (dev server running). Run `npx prisma generate` after stopping the dev server, or restart VS Code — types will resolve on next cold start.
- Pre-existing TS errors in `prisma/seed-orders.ts` (implicit `any`) are unrelated to this batch.
- `Refund.orderId` uses Restrict (not Cascade) — refund records must survive order deletion for financial audit purposes.
