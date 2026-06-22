All 6 sections implemented and the build is clean. Here's what was delivered:

---

## JH-012 Batch 2 — Complete

**Build:** ✅ `next build` — zero errors, zero warnings. All 6 new routes compiled.

### What was built

**2.1 Order Detail — 4-Tab Layout** (`/admin/orders/[id]`)
- Tabs: 概要 (Summary) / 配送 (Shipping) / メッセージ (Messages) / 履歴 (History)
- Summary: items table with subtotal/shipping/total breakdown, Japanese address card (〒postal, prefecture, kana), payment card, status changer
- Shipping: create shipment form (carrier + tracking #), shipment list with timeline events
- Messages: bubble thread with internal note toggle, reply form
- History: status log timeline with old→new badge transitions
- **Tabbed/Stacked layout toggle** — shows all tabs stacked for review/printing

**2.2 Orders List Enhancements** (`/admin/orders`)
- Date chips: 今日 / 今週 / 今月 (toggle on/off)
- **Aging dot**: red `●` on rows >48h old that aren't DELIVERED/CANCELLED/REFUNDED
- All 8 status pills with correct label formatting (Label Created, In Transit, etc.)
- **Bulk action bar**: checkbox selection → change status → Apply (iterates each, tolerates illegal transitions)

**2.3 Refunds** (`/admin/refunds`) — new route
- Stage pipeline: 依頼→承認→処理中→完了 with live counts, click-to-filter
- Review panel via `?review=<id>` — stage-advance button; COMPLETED auto-sets order to REFUNDED

**2.4 Communications Center** (`/admin/messages`) — new route
- 2-col layout: conversation list + thread. URL-driven selection (`?order=id`)
- Bubble thread (customer left, store right, internal notes amber), reply form

**2.5 Integrations Hub** (`/admin/integrations`) — new route
- 3 sections: Payments (Stripe/KOMOJU/PayPay/Rakuten), Shipping (reads TenantCarrier), Email (Resend)
- Live status detection from env vars and TenantCarrier.enabled

**2.6 Employees** (`/admin/employees`) — new route
- Card grid from TenantMembership, avatar initials with deterministic colour, role badges, joined date

**Docs consulted:** CODING-STANDARDS.md, prisma/schema.prisma, gap-analysis.md, opencode-validate.md


| File | Action |
|------|--------|
| `src/app/(admin)/admin/orders/page.tsx` | Rewritten — date filtering, aging logic, passes serialised rows to client |
| `src/components/admin/orders-date-filter.tsx` | Created — 今日/今週/今月 chip filter (URL-bound, toggle on re-click) |
| `src/components/admin/orders-table-client.tsx` | Created — client component with checkbox selection and bulk action bar |

**Features:**
- All 8 status pills via `ORDER_STATUSES` (PENDING → REFUNDED).
- Date chip filter: today (≥midnight), week (≥7d ago), month (≥1st of month). Clicking active chip clears it.
- **Aging dot:** Red `●` on any order older than 48h whose status is not DELIVERED/CANCELLED/REFUNDED.
- **Bulk action bar:** Appears when ≥1 row checked. Select-all checkbox in header. "Change status to…" select → Apply iterates selected IDs through `updateOrderStatus` server action, tolerates per-row failures (illegal transitions silently skipped).
- Status badge colours updated to match all 8 statuses.

---

### 2.3 — Refunds Page

| File | Action |
|------|--------|
| `src/app/(admin)/admin/refunds/page.tsx` | Created |
| `src/app/(admin)/admin/refunds/actions.ts` | Created |
| `src/components/admin/refund-review-panel.tsx` | Created |

**Features:**
- Stage pipeline: 4 cards (依頼/承認/処理中/完了) with live counts. Clicking a stage filters the list; clicking active stage clears filter.
- Refund list: 8 columns — ID, Customer (name + order #), Amount, Reason, Method, Stage badge, Date, 確認 link.
- Review panel: appears when `?review=<id>` is in URL. Shows all refund details + "Approve / Start Processing / Mark Completed" button.
- `advanceRefundStage` action: validates tenant scope, advances REQUESTED→APPROVED→PROCESSING→COMPLETED. On COMPLETED, auto-sets order status to REFUNDED in the same transaction (G-28).

---

### 2.4 — Communications Center

| File | Action |
|------|--------|
| `src/app/(admin)/admin/messages/page.tsx` | Created |
| `src/app/(admin)/admin/messages/actions.ts` | Created |
| `src/components/admin/message-thread.tsx` | Created |

**Features:**
- 2-column layout: left conversation list (300px, scrollable) + right thread panel.
- Conversation list: customer name, order #, last message preview, date. Active conversation highlighted with left border + warm background.
- URL-driven selection: `?order=<id>` — clicking a conversation uses `<Link href>`, server re-renders thread data (no client state needed for selection).
- Thread: bubble layout (customer left / store right / internal notes amber). "内部メモ" toggle shows/hides internal messages.
- Reply form: textarea + internal note toggle + send. `sendMessageFromCenter` server action.

---

### 2.5 — Integrations Hub

| File | Action |
|------|--------|
| `src/app/(admin)/admin/integrations/page.tsx` | Created |

**Features:**
- 3 grouped sections: Payments, Shipping, Email.
- **Payments:** Stripe (connected if STRIPE_SECRET_KEY env set), KOMOJU (not set — placeholder), PayPay, Rakuten.
- **Shipping:** Reads from `TenantCarrier` model — Yamato, Sagawa, Japan Post. Status: connected if `enabled=true`, shows origin postal code. "Manage →" links to /admin/settings.
- **Email:** Resend (connected if RESEND_API_KEY env set).
- Each card: name, description, status badge (Connected / Not configured), optional detail line.

---

### 2.6 — Employee Management

| File | Action |
|------|--------|
| `src/app/(admin)/admin/employees/page.tsx` | Created |

**Features:**
- Fetches `TenantMembership` records with user join, filtered to OWNER/ADMIN/TENANT_ADMIN/EMPLOYEE roles.
- Avatar-initial grid (auto-fill, min 260px). Avatar background colour is deterministic from user ID hash — consistent across page loads.
- Each card: initials avatar, name, email, role badge (OWNER=amber, ADMIN=blue, EMPLOYEE=tan), active status dot + joined date.

---

## Architecture Notes

- **Date serialisation pattern:** Server components convert `Date` → `ISO string` before passing to any client component that receives Prisma data. Client components accept plain strings and call `new Date(iso)` for formatting. This prevents Next.js hydration errors.
- **Server Actions in client components:** `order-detail-tabs.tsx` and `orders-table-client.tsx` import server actions directly — valid in Next.js App Router; bundler strips server code from the client bundle.
- **URL-state for modals/selection:** Refund review panel (`?review=id`) and message thread selection (`?order=id`) are URL-driven — enables deep-linking and server-side rendering of detail data.
- **No schema changes needed:** All new pages use models added in Batch 1 (OrderMessage, Shipment, ShipmentEvent, Refund, TenantCarrier, OrderStatusLog).

## Docs Consulted
- `CODING-STANDARDS.md` — async patterns, server components, Prisma conventions
- `prisma/schema.prisma` — OrderMessage, Shipment, ShipmentEvent, Refund, TenantCarrier, TenantMembership models
- `src/lib/order-status.ts` — status state machine
- Existing pages: orders/page.tsx, orders/[id]/page.tsx, customers/page.tsx — styling patterns
- `.doa/council/JH-012/gap-analysis.md` and `opencode-validate.md` — gap priorities
