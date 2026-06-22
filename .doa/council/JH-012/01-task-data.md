# JH-012: Gap Analysis — New Admin Console vs Existing Codebase

## CONTEXT
The new UI template at C:\Users\Tevin\Downloads\Jazys House Admin (standalone) (1).html is a COMPLETE, fully-clickable Admin Console covering ALL JH-011 design brief sections. It includes:

- **Admin Shell**: dark sidebar (#221913), topbar with currency switcher + language switcher (Auto/日本語/EN), realm switcher (admin/customer), mobile tab bar + More drawer + FAB
- **Order Management**: list with status filters, date chips, aging dots, priority stars, bulk-action bar; 4-tab detail (概要/配送/メッセージ/履歴 — Summary/Shipping/Messages/History) with A/B layout toggle; Create-label modal (form → generating → completed)
- **Refunds**: dedicated page + stage pipeline (依頼→承認→処理→完了) + review modal
- **Communications Center**: inbox + thread + internal notes + email templates tab
- **Integrations**: unified hub grouped by Payments/Shipping/Email with per-provider detail (edit credentials, test connection, remove)
- **Employees**: list cards + detail with role toggle, granular permissions grid, activity log
- **Metrics**: SVG line/bar/pie charts, KPI cards, top-products, Grid↔Focus layout toggle, Query Builder
- **Catering**: order list + detail (menu items, staff assignment, delivery logistics)
- **Shipping & Carriers**: settings per carrier + shipping rates
- **Dashboard**: KPIs, recent orders, low stock, catering widget
- **Customer realm**: Japanese checkout (postal lookup, prefecture, kana fields, PayPay/Konbini/Furikomi/Rakuten), confirmation, order tracking timeline, messages, account
- **Mobile**: tab bar with badges, More drawer, FAB, swipe-hint order cards, condensed screens
- **Language system**: Auto/日本語/EN with locale detection, L() helper, dictionary
- **Currency**: ¥ zero-decimal default with ¥/£/$/€ switcher

## YOUR JOB: Full Gap Analysis
1. Extract the decoded template from the HTML file (same DC bundler format as before)
2. Study EVERY section, component, state, and interaction
3. Compare against the EXISTING Next.js implementation at src/
4. Catalog EVERY gap: what the new UI has that our app doesn't
5. Prioritize: P0 (must have for launch), P1 (soon), P2 (later)
6. Estimate effort per gap (XS/S/M/L/XL)
7. Write to .doa/council/JH-012/gap-analysis.md

## NOTE
This is ANALYSIS only. Do NOT write code. The council will review your findings and dispatch implementation.
