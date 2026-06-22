The gap analysis is written to `.doa/council/JH-012/gap-analysis.md`. Here's the executive summary:

---

## JH-012 Gap Analysis — Summary

**78 gaps cataloged** across 13 sections. Extracted by decoding the DC bundle's `renderVals()` method and comparing against 127 existing `src/` files.

### What's Completely Missing (no route, no schema, no component)
- **Refunds** — P0 (4 gaps: schema, list page, review modal, status auto-set)
- **Communications/Messages** — P1 (5 gaps: schema, inbox, thread view, email templates)
- **Integrations hub** — P1 (4 gaps: schema, list page, detail/credential editor, Ship&co)
- **Shipping/Carriers settings** — P1 (2 gaps: config storage, settings page)

### What's Partially There But Needs Major Work
- **Order detail** — single page needs to become 4-tab layout (Summary/Shipping/Messages/History) with label-creation flow
- **Order status machine** — 5 statuses → 8 (LABEL, TRANSIT, REFUNDED missing, touches schema + state machine + every filter UI)
- **Japanese checkout** — Stripe-only today; needs KOMOJU (P0/XL) for PayPay/Konbini/Furikomi/Rakuten + JP address fields
- **Employees** — `/admin/users` is super-admin global; needs a separate tenant-scoped employee page with permissions grid

### P0 Scorecard (12 gaps — ~3–4 weeks)
KOMOJU integration (XL) is the single biggest item. Everything else in P0 is M or smaller.

### Biggest Risk
KOMOJU (G-38) — parallel checkout flow to Stripe, separate webhook, production-safe error handling. Nothing in the codebase touches it yet.
tering, Shipping — Customers, Messages (badge '3') — Metrics, Query Builder — Employees, Integrations.  
**We have:** Flat nav list: Dashboard, Products, Orders, Catering, Customers, Metrics, Queries, Settings. No grouping, no badges, no Refunds / Messages / Employees / Integrations / Shipping links.

| # | Gap | P | Effort |
|---|-----|---|--------|
| G-05 | Sidebar nav grouping (Operations / Customers / Insights / Settings) | P1 | S |
| G-06 | Pending-count badge on Orders nav item | P1 | S |
| G-07 | Unread-count badge on Messages nav item (requires G-30) | P1 | S |
| G-08 | Add nav entries: Refunds, Messages, Employees, Integrations, Shipping | P1 | XS |

### 1.3 Mobile Tab Bar + More Drawer + FAB
**Template has:** 4-tab bar (Home/Orders/Chat/Catering) with live badge counts. "More" drawer slides up to reveal Refunds, Customers, Employees, Metrics, Query, Integrations, Shipping. FAB (floating action button) for quick actions.  
**We have:** `AdminTabBar` with 4 tabs (Dashboard/Products/Orders/Catering) — no badges, no More drawer, no FAB.

| # | Gap | P | Effort |
|---|-----|---|--------|
| G-09 | Mobile tab bar badge counts (pending orders, unread messages) | P1 | S |
| G-10 | Mobile "More" drawer with overflow nav items | P1 | S |
| G-11 | Mobile FAB for quick actions (new order, create label, etc.) | P2 | S |

---

## Section 2 — Orders: List

**Template has:** Status pills (9 total: ALL, PENDING, PROCESSING, LABEL, SHIPPED, TRANSIT, DELIVERED, CANCELLED, REFUNDED), date chips (today/week/month/custom), aging dots (red indicator when >48h and not completed), priority stars, bulk-action bar (appears on row selection), mobile swipe-hint cards.  
**We have:** Status pills (5: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED), search by name/email, mobile cards.

| # | Gap | P | Effort |
|---|-----|---|--------|
| G-12 | Order status schema expansion: add LABEL, TRANSIT, REFUNDED to `OrderStatus` enum + migration + `allowedNextStatuses()` update | P0 | M |
| G-13 | Date filter chips (today/week/month/custom) on orders list | P1 | S |
| G-14 | Aging dot indicator (red dot when >48h and status not in DELIVERED/CANCELLED) | P1 | XS |
| G-15 | Priority star toggle per order (needs `priority` bool on Order model + migration) | P2 | S |
| G-16 | Bulk-action bar (select rows → bulk status change, bulk label print) | P1 | M |
| G-17 | Mobile swipe-hint on order cards (chevron + "Tap to view" hint) | P2 | XS |

**Schema note for G-12:** Prisma enum `OrderStatus` lives in `prisma/schema.prisma`. `allowedNextStatuses()` in `src/lib/order-status.ts` needs to handle PENDING→PROCESSING→LABEL→SHIPPED→TRANSIT→DELIVERED. REFUNDED is a terminal status set by the Refund system (G-28).

---

## Section 3 — Orders: Detail Page

**Template has:** 4-tab layout (概要 Summary / 配送 Shipping / メッセージ Messages / 履歴 History), tabbed vs stacked layout toggle, Japanese address display (〒postal, prefecture, city, kana), itemized billing (subtotal + shipping cost + total), payment method icon, shipment tracking timeline.  
**We have:** Single-page layout: items table, customer card, raw-JSON address, Stripe session card, status changer. No tabs, no messages, no shipping, no history.

| # | Gap | P | Effort |
|---|-----|---|--------|
| G-18 | 4-tab layout on order detail (Summary / Shipping / Messages / History) with tabbed vs stacked toggle | P0 | M |
| G-19 | Summary tab: itemized billing (subtotal + shipping line) and payment method icon (PayPay/card/konbini/etc.) | P1 | S |
| G-20 | Japanese address display: parse stored JSON into 〒postal / prefecture / city / address lines | P1 | S |
| G-21 | Shipping tab: carrier selector (Yamato/Sagawa/Japan Post), package size picker, "Create Label" flow (form → loading → done) | P0 | L |
| G-22 | Shipment tracking timeline on Shipping tab (requires `Shipment` schema model) | P1 | M |
| G-23 | Messages tab: customer ↔ store thread + internal-note type (see Section 5) | P1 | M |
| G-24 | History/audit log tab: per-order event log (status changes, label created, messages sent) | P1 | M |

**Schema needed for G-22:** `Shipment` model (orderId, tenantId, carrier, trackingNumber, status, timeline events JSON or `ShipmentEvent` model).

---

## Section 4 — Refunds — ENTIRE FEATURE MISSING

**Template has:** Dedicated `/admin/refunds` page. Stage pipeline display (REQUESTED → APPROVED → PROCESSING → COMPLETED) with counts. Full refund list with columns: id, order, customer, amount, reason, payment method, date, status. Review modal with editable amount, approve/deny buttons, DENIED terminal state.  
**We have:** Nothing — no route, no schema, no component.

| # | Gap | P | Effort |
|---|-----|---|--------|
| G-25 | `Refund` schema model: orderId, tenantId, amount, reason, method, stage (REQUESTED/APPROVED/PROCESSING/COMPLETED/DENIED), type (FULL/PARTIAL), createdAt | P0 | S |
| G-26 | `/admin/refunds` page with stage pipeline summary and list | P0 | M |
| G-27 | Refund review modal (edit amount, approve/deny, progress to next stage) | P0 | M |
| G-28 | REFUNDED order status auto-set when refund stage = COMPLETED (links G-12 + G-25) | P0 | S |
| G-29 | Refund count badge on sidebar nav (unreviewed REQUESTED count) | P1 | XS |

---

## Section 5 — Communications Center — ENTIRE FEATURE MISSING

**Template has:** Dedicated `/admin/messages` page. Inbox (conversation list) with unread badge, order/catering tag, customer avatar. Thread view with messages from customer (in) and store (out). Internal notes (staff-only, gold background). Email templates tab: 5 templates (Order Confirmation, Shipping Notification, Delivery Confirmation, Catering Quote, Password Reset) with active/draft status.  
**We have:** `Order.message` is a single plain-text field — not a thread. No route, no component, no schema model.

| # | Gap | P | Effort |
|---|-----|---|--------|
| G-30 | `OrderMessage` schema model: orderId, tenantId, content, side (IN/OUT), senderName, internal (bool), createdAt | P1 | S |
| G-31 | `/admin/messages` page: conversation list (inbox) with unread counts and kind tags (order/catering) | P1 | L |
| G-32 | Thread view: message bubbles, internal note rendering, reply input | P1 | M |
| G-33 | Email templates management tab (list with active/draft toggle, content editable) | P2 | M |
| G-34 | Unread message badge on Messages nav item + mobile tab (requires G-30) | P1 | S |

---

## Section 6 — Integrations — ENTIRE FEATURE MISSING

**Template has:** Dedicated `/admin/integrations` page. Providers grouped by: Payments (KOMOJU, Stripe, PayPay for Business, Rakuten Pay), Shipping (Ship&co, Yamato), Email (Resend). Per-provider: connection status (connected/error/notset), methods list, mode (Live/Test), connected-since date. Detail view: edit credentials form, test-connection button, remove.  
**We have:** Stripe keys are env vars. Settings page has only store name/currency/theme. No integration management UI anywhere.

| # | Gap | P | Effort |
|---|-----|---|--------|
| G-35 | `/admin/integrations` page: grouped provider list with status indicators | P1 | M |
| G-36 | Integration detail: credential editor form (masked API keys), test-connection button | P1 | L |
| G-37 | `Integration` model (or extend `Tenant` with settings JSON): provider, status, mode, since, credentials (encrypted) | P1 | M |
| G-38 | KOMOJU integration wired to checkout (see Section 10) | P0 | XL |
| G-39 | Ship&co integration for label generation (wires to G-21) | P1 | L |

---

## Section 7 — Employees

**Template has:** `/admin/employees` (tenant-scoped). List with employee cards: avatar, name, role badge (OWNER/ADMIN/EMPLOYEE), active status dot, last-active, order count. Detail page: profile, role toggle, granular permissions grid (Orders / Products / Customers / Catering / Settings / Employees × 2-5 sub-permissions each), activity log (last 5 actions with icon, title, detail, timestamp).  
**We have:** `/admin/users` (super-admin only, shows ALL users across ALL tenants). `TenantMembership` model with `role` field (OWNER/ADMIN/EMPLOYEE). No tenant-scoped page, no permissions grid, no activity log.

| # | Gap | P | Effort |
|---|-----|---|--------|
| G-40 | `/admin/employees` page (tenant-scoped list using `TenantMembership`) | P1 | M |
| G-41 | Employee detail page `/admin/employees/[id]` with role toggle | P1 | M |
| G-42 | Granular permissions grid (requires `EmployeePermission` model or JSON field in `TenantMembership`) | P2 | L |
| G-43 | Per-employee activity log (requires `ActivityLog` model: actorId, tenantId, action, detail, createdAt) | P2 | M |
| G-44 | Invite new employee flow (email invite → account creation) | P1 | L |

---

## Section 8 — Metrics / Charts

**Template has:** MTD revenue KPI (with % vs last week), AOV KPI, Refund rate KPI (needs Refund model), New customers KPI. SVG line chart (revenue trend, 12 months). SVG bar chart (orders by day of week, current week). SVG conic/pie chart (payment methods breakdown: PayPay 38%, Card 27%, Konbini 18%, Rakuten 11%, Bank 6%). Top-products table (units + revenue). Grid ↔ Focus layout toggle.  
**We have:** Server-computed KPI cards (MTD revenue vs prev month, order count, low stock, new signups, orders by status, top products by quantity). No charts, no layout toggle, no refund rate, no AOV.

| # | Gap | P | Effort |
|---|-----|---|--------|
| G-45 | SVG line chart: monthly revenue trend (12 months lookback) — pure SVG, no library needed | P1 | M |
| G-46 | SVG bar chart: orders by day of week | P1 | S |
| G-47 | SVG conic/pie chart: payment methods breakdown (requires storing payment method on Order — G-72) | P2 | M |
| G-48 | Refund rate KPI (requires G-25 Refund model) | P1 | S |
| G-49 | AOV KPI: already have revenue + order count — add division | P1 | XS |
| G-50 | Grid ↔ Focus layout toggle (client-side only) | P2 | S |
| G-51 | "New customers" KPI: distinct order emails this month (currently counts newsletter signups) | P1 | S |

---

## Section 9 — Catering

**Template has:** List with status filter (INQUIRY/QUOTED/CONFIRMED/PREP/OUT/COMPLETED). Detail per event: event name, client name/email/phone, date+time, guest count, package type, dietary restrictions, venue, quoted amount, countdown-to-event, menu item prep checklist (per-dish check-off), staff assignment field.  
**We have:** `CateringInquiry` model with status (new/contacted/booked/declined) — different 4-value set. Fields: name, email, phone, eventDate, guestCount, packageType, notes. No detail page. No venue, quote, menu items, staff, countdown.

| # | Gap | P | Effort |
|---|-----|---|--------|
| G-52 | Schema: align `CateringInquiry.status` to INQUIRY/QUOTED/CONFIRMED/PREP/OUT/COMPLETED (migration + seeder update) | P1 | S |
| G-53 | Schema: add fields to `CateringInquiry`: venue, quoteAmount, staffId, countdown | P1 | S |
| G-54 | Schema: `CateringMenuItem` model (inquiryId, dish, qty, prepped bool) | P1 | S |
| G-55 | `/admin/catering/[id]` detail page: event info + menu checklist + staff assignment | P1 | L |
| G-56 | Menu prep checklist component (server action to toggle prepped per item) | P1 | S |
| G-57 | Catering list filter pills aligned to new statuses | P1 | XS |

---

## Section 10 — Shipping / Carriers — ENTIRE FEATURE MISSING

**Template has:** Dedicated `/admin/shipping` page. Per-carrier toggles for Yamato / Sagawa / Japan Post. Per-carrier settings: enabled toggle, pickup cutoff time, delivery time windows (comma-separated), origin address.  
**We have:** Nothing — no route, no schema, no component.

| # | Gap | P | Effort |
|---|-----|---|--------|
| G-58 | Carrier config stored in tenant settings JSON or new `CarrierConfig` model | P1 | S |
| G-59 | `/admin/shipping` page: 3 carrier cards with toggle, cutoff, delivery windows | P1 | M |

---

## Section 11 — Dashboard

**Template has:** Today's revenue (not MTD), pending orders count, "to ship" count (PROCESSING+LABEL orders), inquiries/unread messages count. "Orders needing action" list (PENDING/PROCESSING/LABEL, top 5). Fulfillment summary widget (awaiting label / awaiting pickup / in transit counts). Catering this week (upcoming events with event name, date, guest line).  
**We have:** Greeting, 4 stat cards (total products, total orders, all-time revenue, catering inquiry count), recent orders table (all), low-stock products table.

| # | Gap | P | Effort |
|---|-----|---|--------|
| G-60 | Today's revenue KPI (filter createdAt ≥ midnight today — currently shows all-time) | P1 | S |
| G-61 | "To ship" count KPI (orders with status IN [PROCESSING, LABEL]) | P1 | XS |
| G-62 | Unread messages count KPI (requires G-30 OrderMessage model) | P1 | XS |
| G-63 | "Orders needing action" list filtered to PENDING/PROCESSING/LABEL with aging dots | P1 | S |
| G-64 | Fulfillment summary widget (awaiting label / awaiting pickup / in transit counts) | P1 | S |
| G-65 | Catering this week: upcoming events from CateringInquiry with confirmed status + date in next 7 days | P1 | S |

---

## Section 12 — Customer Realm / Storefront

### 12.1 Japanese Checkout
**Template has:** Postal code field (〒 format), prefecture dropdown (都道府県 — 47 options), city field (市区町村), address line 1 + 2, kana name field (フリガナ), phone field. Billing with subtotal + shipping line.  
**We have:** Single address text field, city, Stripe redirect. No postal lookup, no prefecture dropdown, no kana field, no phone on checkout.

| # | Gap | P | Effort |
|---|-----|---|--------|
| G-66 | Japanese address fields in checkout: postal (〒), prefecture dropdown, city, address lines, kana name | P0 | M |
| G-67 | Japan postal code auto-lookup (JP Post API or `jp-postalcode` library) | P1 | S |
| G-68 | Store shipping address on Order in structured JSON format (not raw text) | P0 | S |

### 12.2 Payment Methods (KOMOJU)
**Template has:** Credit card (Stripe), PayPay, Konbini (7-Eleven/Lawson/FamilyMart/Ministop), Bank Transfer (Furikomi), Rakuten Pay — all via KOMOJU gateway.  
**We have:** Stripe only. KOMOJU not integrated anywhere.

| # | Gap | P | Effort |
|---|-----|---|--------|
| G-69 | KOMOJU SDK integration (server-side checkout session creation, separate from Stripe) | P0 | XL |
| G-70 | Payment method selector UI in checkout (card, PayPay, konbini store picker, bank, Rakuten) | P0 | L |
| G-71 | KOMOJU webhook handler (analogous to existing `src/app/api/webhooks/stripe/route.ts`) | P0 | M |
| G-72 | Store payment method string on Order model (for G-47 reporting) | P1 | S |

### 12.3 Order Tracking (Customer-Facing)
**Template has:** 5-stage timeline on order detail: Order Received → Processing → Shipped → In Transit → Delivered, with colored dots and connecting lines, current stage highlighted.  
**We have:** Order detail shows status text in colored CSS class only. No visual timeline.

| # | Gap | P | Effort |
|---|-----|---|--------|
| G-73 | Order tracking timeline component on customer-facing `/orders/[id]` | P1 | M |
| G-74 | Customer messages tab on `/orders/[id]` (thread with store, links to G-30) | P2 | M |

---

## Section 13 — Language / i18n System

**Template has:** `L(ja, en)` helper function. `lang` state (AUTO/JA/EN). Browser locale detection (`navigator.languages`). All strings present in both Japanese and English throughout — labels, status names, dates, greetings.  
**We have:** English only. No i18n infrastructure.

| # | Gap | P | Effort |
|---|-----|---|--------|
| G-75 | i18n infrastructure: `next-intl` (or custom L() helper) for admin UI strings | P2 | XL |
| G-76 | Japanese translations for all admin section headings, labels, status names | P2 | L |
| G-77 | Japanese translations for customer-facing storefront strings | P2 | L |
| G-78 | User language preference storage (tenant-level default + per-user override) | P2 | M |

---

## Summary by Priority

### P0 — Must Have for Japan Launch (12 gaps)

| Gap | Area | Effort |
|-----|------|--------|
| G-12 | Order status expansion (LABEL, TRANSIT, REFUNDED) | M |
| G-18 | Order detail 4-tab layout | M |
| G-21 | Shipping tab + Create Label flow | L |
| G-25 | Refund schema model | S |
| G-26 | `/admin/refunds` page + pipeline | M |
| G-27 | Refund review modal | M |
| G-28 | REFUNDED status auto-set from refund completion | S |
| G-38 | KOMOJU checkout integration | XL |
| G-66 | Japanese address fields in checkout | M |
| G-68 | Structured address storage on Order | S |
| G-70 | Payment method selector UI | L |
| G-71 | KOMOJU webhook handler | M |

**P0 total effort estimate:** ~3–4 weeks (1 dev)

### P1 — Soon After Launch (37 gaps)

G-01, G-05–G-10, G-13, G-14, G-16, G-19–G-24, G-29–G-32, G-34–G-37, G-39–G-41, G-44–G-46, G-48, G-49, G-51–G-65, G-67, G-72, G-73

**P1 total effort estimate:** ~6–8 weeks

### P2 — Polish / Later (14 gaps)

G-02, G-03, G-04, G-11, G-15, G-17, G-33, G-42, G-43, G-47, G-50, G-74–G-78

---

## Key Schema Migrations Needed (in order)

| # | Migration | Blocks |
|---|-----------|--------|
| 1 | Add `LABEL`, `TRANSIT`, `REFUNDED` to `OrderStatus` enum | G-12, G-28 |
| 2 | Add `priority` bool to `Order` | G-15 |
| 3 | Add `paymentMethod` string to `Order` | G-72, G-47 |
| 4 | New `Refund` model (orderId, tenantId, amount, reason, method, stage, type) | G-25, G-26, G-27, G-28, G-48 |
| 5 | New `OrderMessage` model (orderId, tenantId, content, side, senderName, internal, createdAt) | G-30, G-31, G-32, G-34, G-62 |
| 6 | New `Shipment` + `ShipmentEvent` models | G-22 |
| 7 | Update `CateringInquiry`: new status enum + venue, quoteAmount, staffId fields | G-52, G-53 |
| 8 | New `CateringMenuItem` model | G-54 |
| 9 | Carrier config JSON on `Tenant` settings or new `CarrierConfig` model | G-58 |
| 10 | Integration config: new `Integration` model or extend `Tenant` JSON | G-37 |

---

## Biggest Risk Areas

1. **KOMOJU (G-38/G-69–G-71):** PayPay alone has >50M users in Japan; this is the single highest-risk P0 item. KOMOJU has a Node.js SDK but it's a parallel checkout flow to Stripe — needs its own webhook, order confirmation path, and error handling. Estimate XL (2-5d) for a production-safe implementation.

2. **Order status expansion (G-12):** LABEL and TRANSIT are new enum values on a table with live data. The Prisma migration will need `ALTER TYPE` on the PostgreSQL enum. The state machine in `src/lib/order-status.ts` and every status-filter UI must be updated in the same PR.

3. **Communications Center (G-30–G-34):** The current `Order.message` single-string field must be deprecated without breaking existing orders. Building a full threaded inbox requires a new relational model and is the largest P1 item.

4. **i18n (G-75–G-78):** Touching every string in the app is structural scope (XL). Recommend targeting the checkout form and admin status labels first using a simple inline L(ja, en) helper — defer full `next-intl` adoption to P2.
