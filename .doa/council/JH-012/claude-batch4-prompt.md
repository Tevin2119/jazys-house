# JH-012 Batch 4 — Metrics, Dashboard, Settings & Remaining Pages

Read .doa/council/JH-012/gap-analysis.md sections for dashboard, metrics, employee detail, and settings.

## 4.1 Enhanced Metrics Dashboard
File: src/app/(admin)/admin/metrics/page.tsx
- Drag-and-drop grid layout for metric cards (use CSS grid, no library needed for now)
- KPI cards: Revenue (month), Orders, AOV, Customers — with trend arrows
- SVG charts: line chart (revenue over time), bar chart (orders by status), pie chart (product categories)
- Generate charts server-side as SVG or use a lightweight canvas approach
- "Add Metric" button → choose from saved queries or templates
- Grid↔Focus layout toggle
- Link to query builder for custom metrics

## 4.2 Enhanced Admin Dashboard
File: src/app/(admin)/admin/page.tsx
- Add date filter: 今日 / 今週 / 今月 to KPI section
- Add quick-action buttons: New Order (manual), Create Shipment, Send Message
- Pending orders count with link to filtered orders list
- Unread messages count with link to communications center

## 4.3 Employee Detail (full)
New: src/app/(admin)/admin/employees/[id]/page.tsx
- Profile section: name, email, role, active toggle
- Permissions grid: categories (Orders, Products, Customers, Catering, Settings, Reports, Employees) × actions (View, Edit, Manage)
- Stored as JSON on TenantMembership
- Activity log: timestamped actions list

## 4.4 Settings Pages  
- Carrier settings: src/app/(admin)/admin/settings/carriers/page.tsx — per-carrier config (api key, origin, enabled), test connection
- Email templates: src/app/(admin)/admin/settings/email-templates/page.tsx — list + edit modal
- Shipping rates: src/app/(admin)/admin/settings/shipping-rates/page.tsx — rate table by weight/region

## RULES
- Read existing code before editing
- Run npm run build after changes
- Write summary to .doa/council/JH-012/claude-implementation-batch4.md
