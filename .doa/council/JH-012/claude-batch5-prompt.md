# JH-012 Batch 5 — Final Integration & Validation

## 5.1 Push schema changes
Commit all schema changes. We cannot run db push (DIRECT_URL issue) but schema is ready for Vercel deployment.

## 5.2 Wire admin sidebar nav
Update sidebar-nav.tsx with all new routes:
- Add: Refunds, Messages, Employees, Integrations, Shipping (carriers)
- Group nav items: Operations (Orders, Products, Refunds), Customers (Customers, Messages), Management (Employees, Integrations, Shipping, Catering), Insights (Dashboard, Metrics, Queries)
- Add pending/unread badges where data available

## 5.3 Wire mobile admin tab bar
Update admin-tab-bar.tsx:
- Add badge counts (pending orders, unread messages)
- Add "More" drawer with overflow items

## 5.4 Final build check
- Run npm run build — confirm 0 errors
- Verify all new routes compile: /admin/refunds, /admin/messages, /admin/integrations, /admin/employees, /admin/employees/[id], /admin/settings/carriers, /admin/settings/email-templates, /admin/settings/shipping-rates

## 5.5 Write final gap status
Update gap-analysis.md with status of all 78 gaps:
- ✅ Done (which gaps are now closed)
- 🔄 In progress (which are partially done)
- ⏳ Remaining (what's left for future batches)

## 5.6 Push to GitHub
- Commit everything
- Push to main
- Notify user: Vercel auto-deploys

## RULES
- Read existing files before editing
- npm run build after ALL changes
- Write summary to .doa/council/JH-012/claude-implementation-batch5.md
