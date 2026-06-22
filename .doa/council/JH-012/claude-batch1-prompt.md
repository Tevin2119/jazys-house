# JH-012 Batch 1 — Schema Foundations (P0)

Read .doa/council/JH-012/gap-analysis.md.

## Implement these schema changes in order:

### M1: Order Status Expansion
- Add LABEL_CREATED, IN_TRANSIT, REFUNDED to OrderStatus enum in prisma/schema.prisma
- Update src/lib/order-status.ts — add new statuses to allowedNextStatuses() transition graph
- PENDING→PROCESSING→LABEL_CREATED→SHIPPED→IN_TRANSIT→DELIVERED
- CANCELLED allowed from PENDING, PROCESSING, LABEL_CREATED
- REFUNDED from DELIVERED (full) or CANCELLED (partial)

### M2: OrderStatusLog (audit trail)
- New model: id, orderId, tenantId, oldStatus, newStatus, changedBy (userId), reason (string?), createdAt
- Every status change logs here
- Query: getStatusHistory(orderId) returns ordered by createdAt

### M3: OrderMessage
- New model: id, orderId, tenantId, content, side (CUSTOMER/STORE), senderName, isInternal (bool), createdAt
- isInternal=true means admin-only note (yellow bg in UI)
- Query: getOrderMessages(orderId) returns all messages ordered by createdAt

### M4: Shipment + ShipmentEvent
- Shipment: id, orderId, tenantId, carrier (enum), trackingNumber, labelUrl, status, createdAt
- ShipmentEvent: id, shipmentId, status, location, timestamp, description
- Tracking timeline per shipment

### M5: Refund
- New model: id, orderId, tenantId, amount (Int, minor units), reason, stage (REQUESTED/APPROVED/PROCESSING/COMPLETED), method, createdAt
- Stage state machine: REQUESTED→APPROVED→PROCESSING→COMPLETED

### M6: JPY Currency Fix
- Add currency helper to src/lib/utils.ts: `formatPrice(amount, currency)` that doesn't divide by 100 for JPY
- `toMinorUnits(amount, currency)` that doesn't multiply by 100 for JPY  
- Zero-decimal currencies: JPY, KRW, VND
- Update ALL call sites: product cards, admin products, orders, checkout, metrics, analytics

### RULES
- Read existing schema, auth, and utils before editing
- Add proper indexes, tenantId, relations
- Run npx prisma format after schema changes
- Do NOT run db push (DIRECT_URL broken) — schema changes will be pushed via Supabase SQL
- Write summary to .doa/council/JH-012/claude-implementation-batch1.md
