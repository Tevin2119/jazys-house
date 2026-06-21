# Jazy's House Platform — JH-011 Full UI/UX Design Brief

> For: Claude Design / UI designer
> Based on: Council JH-011 investigation + OpenCode validation + Maker synthesis + Archivist verdict
> Design system: Marcellus + Hanken Grotesk, terracotta #c0563d, cream #f6efe4, dark #221913, 999px pills
> Location: Tokyo, Japan — Japanese UX conventions throughout

---

## SECTION 1 — Japanese Checkout

### 1.1 Checkout Page (customer-facing)
**Route:** `/checkout`

**Layout:** 2-col on desktop (cart summary left, payment right). Stacked on mobile.

**Cart Summary (left):**
- Product thumbnails (56px), name, qty, line price
- Subtotal, shipping (TBD), total in ¥ JPY
- "← Back to shop" link

**Payment Method Selector (right):**
- Radio/pill selector for payment methods:
  - 💳 Credit Card (Stripe)
  - 📱 PayPay
  - 🏪 Convenience Store (Konbini) — with sub-selector: 7-Eleven, Lawson, FamilyMart, Ministop
  - 🏦 Bank Transfer (Furikomi)
  - 📱 Rakuten Pay
- Each option: icon + name + brief description
- Selected state: terracotta border

**Shipping Address Form:**
- Postal code input (〒) with auto-lookup button "住所検索" (Address Search)
- Prefecture dropdown (都道府県): 47 prefectures in Japanese order
- City/Ward (市区町村) — auto-filled from postal lookup
- Address line 1 (町名・番地) — chome/banchi
- Address line 2 (建物名・部屋番号) — building/room (optional)
- Name fields: Last name (姓) + First name (名) + Kana (セイ / メイ)
- Phone number
- "Save address" checkbox

**Order Review:**
- Final total in JPY
- Estimated delivery (TBD by shipping)
- "Place Order" CTA — terracotta pill, full-width on mobile

**States:**
- Loading: skeleton cards
- Error: inline error messages per field
- Postal lookup loading: spinner on button
- Success: redirect to confirmation

### 1.2 Order Confirmation Page
**Route:** `/checkout/confirmation?session_id=...`

- ✅ Success icon + "ご注文ありがとうございます" (Thank you for your order)
- Order number
- Payment method + status
- Estimated delivery date
- Tracking link (when available)
- "Continue Shopping" / "View Order" buttons

---

## SECTION 2 — Order Management Dashboard (Admin)

### 2.1 Orders List
**Route:** `/admin/orders`

**Filter bar:**
- Status filter pills (ALL | PENDING | PROCESSING | LABEL CREATED | SHIPPED | IN TRANSIT | DELIVERED | CANCELLED | REFUNDED)
- Date range picker (今日 / 今週 / 今月 / custom)
- Search by order #, customer name, email
- Carrier filter dropdown (All / Yamato / Sagawa / Japan Post)

**Order cards (mobile) / Table (desktop):**
- Order ID, customer name, total (¥), status badge, items count, date, carrier icon
- Status badges with DC spec colors
- Aging indicator: red dot for orders >48h in same status
- Priority flag (toggle per order)
- Bulk action bar (appears when items checked): change status, print labels, export

**Quick actions per order:**
- View detail
- Create label
- Send message
- Change status

### 2.2 Order Detail
**Route:** `/admin/orders/[id]`

**Header:**
- Order #, status badge, created date
- "Back to orders" link

**Sections (tabbed or stacked):**

**Summary Tab:**
- Customer: name, email, phone, address (Japanese formatted)
- Items: thumbnail, name, qty, unit price, line price
- Payment: method, status, transaction ID, amount
- Totals: subtotal, shipping, total

**Fulfillment Tab:**
- Shipment list (multiple shipments per order)
- Each shipment: carrier, tracking #, label URL (PDF download), status, created date
- "Create Shipment" button → opens shipment form
- Shipment form: carrier selector, package size/weight, "Generate Label" button
- Tracking timeline: event log with timestamps (label created, picked up, in transit, out for delivery, delivered)

**Messages Tab:**
- Message thread (admin ↔ customer)
- Each message: sender name, timestamp, content, visibility (public/private)
- Message input at bottom (textarea + send button)
- Internal notes: admin-only, yellow bg, collapsible
- Template quick-insert buttons: "Order confirmed", "Shipped", "Delivery today", "Delivered", "Custom"

**History Tab:**
- Status change timeline: old status → new status, who, when, reason (optional)
- Audit log: all admin actions on this order

**States:**
- Loading: skeleton
- Empty shipment: "No shipments yet — create one to generate a label"
- Empty messages: "No messages — send the first one"
- Error: retry button

### 2.3 Shipment Creation Modal
**Route:** inline modal on order detail

- Carrier selector (Yamato, Sagawa, Japan Post)
- Package type: predefined sizes or custom L/W/H + weight
- Shipping origin (from tenant settings, editable)
- Shipping destination (from order address, auto-filled)
- Desired ship date
- Delivery time window (optional: 午前中 / 14-16時 / 16-18時 / 18-20時 / 19-21時)
- "Generate Label" CTA
- Loading: progress bar during label API call
- Success: "Label created ✓" with download button + tracking #
- Error: error message with retry

### 2.4 Batch Operations Bar
**Appears when:** 1+ orders selected via checkbox

**Actions:**
- "Change Status" dropdown → select target status → confirm modal
- "Print Labels" → bulk label generation → downloads zip
- "Export CSV" → download filtered orders
- "Assign to Employee" dropdown → select employee

---

## SECTION 3 — Shipping & Carriers

### 3.1 Carrier Settings
**Route:** `/admin/settings/carriers`

**Per tenant:**
- Carrier list: Yamato, Sagawa, Japan Post (toggle on/off)
- Each carrier:
  - API credentials (masked, edit button)
  - Default package types
  - Shipping origin address
  - Cutoff time for same-day pickup
  - Delivery time window options
  - Tracking URL template
- "Test Connection" button per carrier
- Status indicator: connected ✅ / error ❌ / not configured ⚠️

### 3.2 Shipping Rates (future)
**Route:** `/admin/settings/shipping-rates`

- Rate tables by weight/size/region
- Domestic (Japan) vs international
- Free shipping threshold
- Per-carrier rate overrides

---

## SECTION 4 — Communications Center

### 4.1 Message Inbox
**Route:** `/admin/messages`

**Layout:** 2-col (conversation list left, message thread right)

**Conversation List (left):**
- Search bar
- Filter: All / Unread / Orders / Catering
- Each conversation: customer name, order #, last message preview, timestamp, unread dot
- Active conversation highlighted

**Message Thread (right):**
- Customer info card (name, email, order #, link to order)
- Message list: sent/received bubbles, timestamps
- Public messages: white bg (customer visible)
- Internal notes: yellow bg, lock icon (admin only)
- Message input + send button + template selector

**Empty state:** "Select a conversation or start one from an order"

### 4.2 Email Templates
**Route:** `/admin/settings/email-templates`

- Template list: Order Confirmation, Shipping Notification, Delivery Confirmation, Catering Quote, Password Reset, Custom
- Each template: subject line, body (HTML/text), variables list
- Preview button (renders with sample data)
- Edit inline or modal
- Default templates provided, editable

---

## SECTION 5 — Query Builder + Metrics Plugin

### 5.1 Query Builder
**Route:** `/admin/query-builder`

**Existing** — enhance with:
- Metric association: "Save as Metric" checkbox
- Chart type selector for metrics: number card, line chart, bar chart, pie chart, table
- Schedule: auto-refresh interval (1min, 5min, 15min, 1hr, manual)
- Share: generate shareable link (read-only)

### 5.2 Metrics Dashboard
**Route:** `/admin/metrics`

**Layout:** drag-and-drop grid (react-grid-layout or similar)

**Metric cards:**
- Number card: label, large value, trend arrow (↑↓), comparison (%)
- Line chart: time-series data, date range selector
- Bar chart: category comparison
- Pie chart: distribution
- Table: tabular data

**Card controls:**
- Edit (opens query builder pre-filled)
- Refresh
- Remove
- Resize handle (bottom-right)
- Drag handle (top-left)

**Add metric flow:**
- "Add Metric" button → choose: from saved query / create new / from template
- Templates: Revenue this month, Orders by status, Top products, Inventory health, Customer growth

**Dashboard states:**
- Empty: "Add your first metric — track revenue, orders, or any custom data"
- Loading: skeleton cards
- Error per card: retry button

### 5.3 Plugin System (future)
**Route:** `/admin/plugins`

- Plugin registry (per tenant)
- Each plugin: name, description, author, version, enabled toggle
- Plugin config: JSON editor or form
- Built-in plugins: Revenue tracker, Inventory alerts, Customer retention
- Custom plugin: upload JS/TS file

---

## SECTION 6 — Employee Management

### 6.1 Employees List
**Route:** `/admin/employees`

**Layout:** card grid or table

**Each employee:**
- Avatar (initial circle), name, email, role badge
- Status: active / inactive
- Last active timestamp
- Order count assigned
- Actions: edit, deactivate, delete

**Add employee flow:**
- "Add Employee" button → modal
- Email, name, role (OWNER/ADMIN/EMPLOYEE), tenant assignment
- Send invitation email toggle
- Default permissions template by role

### 6.2 Employee Detail / Edit
**Route:** `/admin/employees/[id]`

**Sections:**

**Profile:**
- Name, email, phone
- Role dropdown
- Active toggle
- Joined date
- Tenant memberships (multi-select)

**Permissions (per employee override):**
- Permission categories with checkboxes:
  - Orders: view, edit, change status, create shipments, refund
  - Products: view, create, edit, delete, manage inventory
  - Customers: view, export
  - Catering: view, manage, reply
  - Settings: view, edit (carrier, payment, email, store)
  - Reports: view, export
  - Employees: view, manage (OWNER only)
- "Reset to role defaults" button

**Activity Log:**
- Timestamped list of actions: login, order status change, shipment created, message sent, settings changed
- Filterable by date, action type

---

## SECTION 7 — Catering Operations

### 7.1 Catering Orders
**Route:** `/admin/catering`

**Status workflow:** Inquiry → Quoted → Confirmed → Prep → Out for Delivery → Completed

**Card grid (DC spec):**
- Event name, customer, date, guest count, package, status badge
- Dietary requirements tag (if present)
- Assigned staff (avatar)
- Time until event (countdown for today/tomorrow)
- Quick actions: Reply, Update Status, Assign Staff

**Filter bar:**
- Status pills (all workflow states)
- Date range (upcoming, this week, this month, custom)
- Search by event name or customer

### 7.2 Catering Order Detail
**Route:** `/admin/catering/[id]`

**Sections:**

**Event Summary:**
- Event name, customer (name, email, phone), date, time, guest count
- Venue/location address
- Package selected
- Dietary requirements (free text from inquiry form)
- Special instructions

**Menu / Items:**
- Dish list with quantities
- Ingredient checklist (per dish, mark as prepped)
- Serving equipment checklist

**Staff Assignment:**
- Dropdown: select employee(s) assigned
- Each staff: name, role, contact

**Delivery / Logistics:**
- Delivery address (may differ from venue)
- Delivery time window
- Transport method (self / courier)
- "Create Shipment" if items need shipping

**Messages:**
- Same message thread pattern as orders
- Template quick-insert: Quote, Confirmation, Reminder, Follow-up

**Timeline:**
- Status changes + admin actions + messages
- Visual timeline with icons per event type

---

## SECTION 8 — Customer-Facing Pages (Japanese UX)

### 8.1 Order Tracking (customer)
**Route:** `/orders/[id]`

- Order number, status badge (Japanese labels)
- Status timeline: visual steps with icons
  - 注文受付 (Order Received) → 処理中 (Processing) → 発送済み (Shipped) → 配達中 (In Transit) → 配達完了 (Delivered)
- Tracking number + carrier link
- Estimated delivery date
- Items list with thumbnails
- "Contact about this order" button → opens message thread

### 8.2 Customer Messages
**Route:** `/orders/[id]/messages`

- Message thread (customer ↔ store)
- Customer sees only public messages
- Input + send button
- Email notification toggle: "Notify me of replies"

### 8.3 Customer Account
**Route:** `/account`

**Existing** — enhance with:
- Saved addresses (Japanese format)
- Default payment method
- Notification preferences: email, SMS (future)
- Language preference: 日本語 / English

---

## SECTION 9 — Mobile-First Patterns

All admin pages must work on 375px width (iPhone SE):

### 9.1 Mobile Admin Tab Bar (existing — enhance)
- Tabs: Dashboard / Orders / Messages / Catering / More (…)
- Badge counts on Orders (pending), Messages (unread)
- "More" opens drawer with: Products, Customers, Employees, Settings, Metrics, Query Builder

### 9.2 Mobile Order Card
- Compact card: order #, customer, total, status badge, aging dot
- Swipe actions: left = quick status change, right = create label
- Tap to expand: shows items, actions
- Long press: select for batch operations

### 9.3 Mobile Quick Actions FAB
- Floating action button (bottom-right, above tab bar)
- Expands to: New Order (manual), Scan Tracking, Quick Message
- Context-aware: on catering page → New Catering Inquiry

---

## SECTION 10 — Design Tokens Summary

| Token | Value | Usage |
|-------|-------|-------|
| Font heading | Marcellus, 400 | Page titles, section heads, product names |
| Font body | Hanken Grotesk, 400-800 | Body, nav, buttons, labels |
| Primary | #c0563d (terracotta) | CTAs, active states, accents |
| Primary hover | #a3442e | Button hover |
| Gold accent | #c79a55 | Logo border, admin avatar |
| Dark | #2a1f16 | Text, badges |
| Dark bg | #221913 | Sidebar, footer, tab bar |
| Cream bg | #f6efe4 | Page background |
| Card bg | #fffdf9 | Cards, panels |
| Card border | #ece2d2 | Card borders |
| Muted text | #6b5d4f | Secondary text |
| Light text | #cbb9a3 | Inactive nav, placeholders |
| Button radius | 999px | All buttons, pills, badges |
| Card radius | 10-12px | Cards, modals |
| Input radius | 9-10px | Text inputs, selects |
| Shadow card | 0 1px 3px rgba(0,0,0,0.04) | Product cards |
| Shadow elevated | 0 18px 44px rgba(42,31,22,0.20) | Modals, overlays |
| Glass header | rgba(246,239,228,0.92) + blur(10px) | Storefront header |
| Status red | bg #f3dad4, text #a3442e | Out of stock, cancelled |
| Status amber | bg #fbe5cf, text #9a6b1e | Pending, low stock |
| Status green | bg #d8ecd9, text #2f6b3a | In stock, delivered |
| Status blue | bg #d8e6f5, text #2f5d8a | Processing, shipped |
| Status purple | bg #e2dcf2, text #5a4a9a | In transit |

---

## SECTION 11 — Japanese-Specific Patterns

### 11.1 Address Format
```
〒123-4567
東京都渋谷区神宮前1-2-3
マンション名 401号室
```

### 11.2 Status Labels (Japanese)
| English | Japanese |
|---------|----------|
| Pending | 未処理 |
| Processing | 処理中 |
| Label Created | ラベル作成済 |
| Shipped | 発送済み |
| In Transit | 配達中 |
| Delivered | 配達完了 |
| Cancelled | キャンセル |
| Refunded | 返金済み |

### 11.3 Payment Method Labels (Japanese)
| Method | Japanese |
|--------|----------|
| Credit Card | クレジットカード |
| PayPay | PayPay |
| Convenience Store | コンビニ払い |
| Bank Transfer | 銀行振込 |
| Rakuten Pay | 楽天ペイ |

### 11.4 Date/Time Format
- Japanese era optional (令和8年) or Western (2026年)
- Time: 24h or AM/PM with Japanese labels (午前/午後)
- Delivery windows: 午前中, 14-16時, 16-18時, 18-20時, 19-21時

### 11.5 Currency Display
- Always show ¥ symbol
- No decimal places (JPY is zero-decimal)
- Example: ¥1,280
- Foreign currency conversion display only in settings

---

## SECTION 12 — States & Edge Cases

Every component must handle:

| State | Visual |
|-------|--------|
| **Loading** | Skeleton cards matching content shape |
| **Empty** | Icon + heading + description + CTA |
| **Error** | Error message + retry button |
| **Success** | Brief toast or inline confirmation |
| **Disabled** | Reduced opacity, not-allowed cursor |
| **Processing** | Loading spinner on button, disabled inputs |

---

*End of design brief. Covers 12 sections, ~50+ pages/components/states. Ready for designer to create HTML markup.*
