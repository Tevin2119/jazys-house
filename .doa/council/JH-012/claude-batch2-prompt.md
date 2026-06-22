# JH-012 Batch 2 — Admin Pages Implementation

Read .doa/council/JH-012/gap-analysis.md and .doa/council/JH-012/opencode-validate.md.

The new UI template at C:\Users\Tevin\Downloads\Jazys House Admin (standalone) (1).html has the COMPLETE admin console. Build these admin pages matching the template's layout, data, and interactions.

## 2.1 Order Detail — 4-Tab Layout
File: src/app/(admin)/admin/orders/[id]/page.tsx
Replace single-page view with tabbed layout:
- Tab 1: 概要 (Summary) — customer info, items table, payment details, totals
- Tab 2: 配送 (Shipping) — shipment list, create shipment button, tracking timeline
- Tab 3: メッセージ (Messages) — message thread with internal notes toggle
- Tab 4: 履歴 (History) — status change timeline, audit log
- Add A/B layout toggle (Tabbed vs Stacked) as admin preference
- Use new Shipment, OrderMessage, OrderStatusLog models
- Status badges with DC spec colors

## 2.2 Orders List Enhancements
File: src/app/(admin)/admin/orders/page.tsx
- Add new status pills: LABEL_CREATED, IN_TRANSIT, REFUNDED
- Date filter chips: 今日 / 今週 / 今月 / custom date range
- Aging dot: red indicator when order >48h and not completed
- Bulk-action bar (appears when rows selected): change status, print labels
- Priority star toggle (uses Order.priority field from Batch 1b)

## 2.3 Refunds Page  
New route: src/app/(admin)/admin/refunds/page.tsx
- List of refunds with stage pipeline: 依頼→承認→処理→完了
- Filter by stage, date range
- Review modal: order ID, amount, reason, method, current stage, actions
- Stage advance buttons per refund
- Uses Refund model from Batch 1

## 2.4 Communications Center
New route: src/app/(admin)/admin/messages/page.tsx
- 2-col layout: conversation list (left) + message thread (right)
- Conversation list: customer name, order #, last message preview, timestamp, unread dot
- Message thread: bubbles (customer left, store right), internal notes (yellow bg)
- Message input + send button
- Email templates tab: list of templates, edit inline
- Uses OrderMessage model from Batch 1

## 2.5 Integrations Hub
New route: src/app/(admin)/admin/integrations/page.tsx
- Grouped by: Payments (KOMOJU, Stripe, PayPay, Rakuten), Shipping (Ship&co, Yamato, Sagawa, Japan Post), Email (Resend)
- Each provider card: name, status (connected/error/not configured), quick actions
- Provider detail modal/page: edit API credentials, test connection, enable/disable, remove
- Uses TenantCarrier model + new IntegrationConfig (JSON on Tenant or new model)

## 2.6 Employee Management
Update: src/app/(admin)/admin/users/page.tsx → split into tenant-scoped employees
New route: src/app/(admin)/admin/employees/page.tsx
- Card grid: avatar initial, name, email, role badge, status (active/inactive)
- Detail page: profile, role dropdown, granular permissions grid (checkboxes per category), activity log
- Uses existing User + TenantMembership models
- Permissions stored as JSON on TenantMembership

## RULES
- Read existing code before editing
- Match the template's exact layout and data presentation
- Use existing Prisma models + new ones from Batch 1
- Run npm run build after each section
- Write summary to .doa/council/JH-012/claude-implementation-batch2.md
