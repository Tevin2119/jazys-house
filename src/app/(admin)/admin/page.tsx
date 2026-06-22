export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/admin/status-badge";

// ──────────────── date helpers ────────────────

function getDateStart(filter: string): Date {
  const now = new Date();
  if (filter === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (filter === "week")  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return new Date(now.getFullYear(), now.getMonth(), 1); // month
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ──────────────── inline components ────────────────

function StatCard({ label, value, sub, href }: { label: string; value: React.ReactNode; sub: string; href?: string }) {
  const inner = (
    <div style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13, padding: "20px 22px", textDecoration: "none", display: "block" }}>
      <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#a3442e", fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: "'Marcellus', serif", fontSize: 34, margin: "8px 0 4px", color: "#2a1f16" }}>{value}</div>
      <div style={{ fontSize: 12.5, color: "#6b8a5c", fontWeight: 600 }}>{sub}</div>
    </div>
  );
  if (href) return <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link>;
  return inner;
}

function StockPill({ stock }: { stock: number }) {
  if (stock === 0) return <span style={{ background: "#f3dad4", color: "#a3442e", padding: "3px 11px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>Out of stock</span>;
  if (stock <= 5)  return <span style={{ background: "#fbe5cf", color: "#9a6b1e", padding: "3px 11px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{stock} left</span>;
  return <span style={{ background: "#d8ecd9", color: "#2f6b3a", padding: "3px 11px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{stock} in stock</span>;
}

// ──────────────── client: date-filter chips ────────────────
// (imported below as a client component)

import { DateFilterChips } from "@/components/admin/date-filter-chips";

// ──────────────── page ────────────────

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ dateFilter?: string }>;
}) {
  const { tenantId, session } = await getAdminContext();
  const { dateFilter = "month" } = await searchParams;
  const dateStart = getDateStart(dateFilter);
  const agingThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const periodLabel = dateFilter === "today" ? "Today" : dateFilter === "week" ? "This Week" : "This Month";

  const [
    periodRevenue,
    periodOrderCount,
    pendingCount,
    toShipCount,
    unreadMessages,
    inTransitCount,
    actionOrders,
    catering,
    lowStockProducts,
    tenant,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true },
      where: { tenantId, status: "DELIVERED", createdAt: { gte: dateStart } },
    }),
    prisma.order.count({ where: { tenantId, createdAt: { gte: dateStart } } }),
    prisma.order.count({ where: { tenantId, status: "PENDING" } }),
    prisma.order.count({ where: { tenantId, status: { in: ["PROCESSING", "LABEL_CREATED"] } } }),
    prisma.orderMessage.count({ where: { tenantId, side: "CUSTOMER", createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.order.count({ where: { tenantId, status: "IN_TRANSIT" } }),
    prisma.order.findMany({
      where: { tenantId, status: { in: ["PENDING", "PROCESSING", "LABEL_CREATED"] } },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
    prisma.cateringInquiry.findMany({
      where: {
        tenantId,
        status: "booked",
        date: { gte: now.toISOString().slice(0, 10), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) },
      },
      orderBy: { date: "asc" },
      take: 3,
    }),
    prisma.product.findMany({
      where: { tenantId, deletedAt: null, stock: { lte: 8 } },
      select: { id: true, name: true, stock: true },
      orderBy: { stock: "asc" },
      take: 5,
    }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { currency: true } }),
  ]);

  const currency = tenant?.currency ?? "gbp";
  const revenue  = periodRevenue._sum.total ?? 0;

  return (
    <div>
      {/* Greeting + actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Marcellus', serif", fontSize: 30, margin: "0 0 4px", fontWeight: 400 }}>
            {getGreeting()}{session.user.name ? `, ${session.user.name}` : ""} 👋
          </h1>
          <p style={{ fontSize: 14.5, color: "#6b5d4f", margin: 0 }}>{dateStr}</p>
        </div>
        {/* Quick actions */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/admin/orders" style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, borderRadius: 9, background: "#c0563d", color: "white", textDecoration: "none" }}>
            + New Order
          </Link>
          <Link href="/admin/orders?status=PROCESSING" style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, borderRadius: 9, border: "1px solid #ece2d2", background: "#fffdf9", color: "#6b5d4f", textDecoration: "none" }}>
            📦 Create Shipment
          </Link>
          <Link href="/admin/messages" style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, borderRadius: 9, border: "1px solid #ece2d2", background: "#fffdf9", color: "#6b5d4f", textDecoration: "none" }}>
            💬 Send Message
          </Link>
        </div>
      </div>

      {/* Date filter chips */}
      <div style={{ marginBottom: 20 }}>
        <DateFilterChips active={dateFilter} />
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18, marginBottom: 26 }}>
        <StatCard
          label={`Revenue · ${periodLabel}`}
          value={formatPrice(revenue, currency)}
          sub={`${periodOrderCount} orders placed`}
        />
        <StatCard
          label="Pending Orders"
          value={pendingCount}
          sub="awaiting action"
          href="/admin/orders?status=PENDING"
        />
        <StatCard
          label="To Ship"
          value={toShipCount}
          sub="processing + label created"
          href="/admin/orders?status=PROCESSING"
        />
        <StatCard
          label="Unread Messages"
          value={unreadMessages}
          sub="from customers (7 days)"
          href="/admin/messages"
        />
      </div>

      {/* Main 2-col */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 22, alignItems: "start" }}
        className="max-lg:flex max-lg:flex-col"
      >
        {/* Orders Needing Action */}
        <div style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #ece2d2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Marcellus', serif", fontSize: 19 }}>Orders Needing Action</span>
            <Link href="/admin/orders" style={{ fontSize: 13, fontWeight: 700, color: "#c0563d" }}>View all →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "0.7fr 1.4fr 0.6fr 0.8fr 1fr", padding: "11px 22px", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#a39685", fontWeight: 700, borderBottom: "1px solid #f0e8da" }}>
            <span>Order</span><span>Customer</span><span>Items</span><span>Total</span><span>Status</span>
          </div>
          {actionOrders.length === 0 ? (
            <div style={{ padding: "32px 22px", textAlign: "center", color: "#a39685", fontSize: 14 }}>All caught up — no orders need action.</div>
          ) : (
            actionOrders.map(o => {
              const isAging = o.createdAt < agingThreshold;
              return (
                <div key={o.id} style={{ display: "grid", gridTemplateColumns: "0.7fr 1.4fr 0.6fr 0.8fr 1fr", padding: "14px 22px", fontSize: 14, alignItems: "center", borderBottom: "1px solid #f4ecde" }}>
                  <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                    <Link href={`/admin/orders/${o.id}`} style={{ color: "#2a1f16", textDecoration: "none" }}>#{o.id.slice(0, 6)}</Link>
                    {isAging && <span title=">48h unactioned" style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#e03131", flexShrink: 0 }} />}
                  </span>
                  <span>{o.name ?? o.email ?? "—"}</span>
                  <span style={{ color: "#6b5d4f" }}>{o._count.items}</span>
                  <span style={{ fontWeight: 700 }}>{formatPrice(o.total, o.currency)}</span>
                  <span><OrderStatusBadge status={o.status} /></span>
                </div>
              );
            })
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Fulfillment summary */}
          <div style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13, padding: "18px 22px" }}>
            <div style={{ fontFamily: "'Marcellus', serif", fontSize: 18, marginBottom: 14 }}>Fulfillment Summary</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Awaiting Label",   count: toShipCount - inTransitCount > 0 ? pendingCount : pendingCount, color: "#fbe5cf", textColor: "#9a6b1e", href: "/admin/orders?status=PENDING" },
                { label: "Awaiting Pickup",  count: toShipCount, color: "#d8e6f5", textColor: "#2f5d8a", href: "/admin/orders?status=PROCESSING" },
                { label: "In Transit",       count: inTransitCount, color: "#e2dcf2", textColor: "#5a4a9a", href: "/admin/orders?status=IN_TRANSIT" },
              ].map(row => (
                <Link key={row.label} href={row.href} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 9, background: row.color, textDecoration: "none" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: row.textColor }}>{row.label}</span>
                  <span style={{ fontSize: 20, fontFamily: "'Marcellus', serif", color: row.textColor }}>{row.count}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Low Stock */}
          <div style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13, padding: "18px 22px" }}>
            <div style={{ fontFamily: "'Marcellus', serif", fontSize: 18, marginBottom: 14 }}>Low Stock</div>
            {lowStockProducts.length === 0 ? (
              <p style={{ fontSize: 14, color: "#8a7c6a" }}>All products well stocked.</p>
            ) : (
              lowStockProducts.map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #f4ecde", fontSize: 14 }}>
                  <span>{p.name}</span>
                  <StockPill stock={p.stock} />
                </div>
              ))
            )}
          </div>

          {/* Catering This Week */}
          <div style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13, padding: "18px 22px" }}>
            <div style={{ fontFamily: "'Marcellus', serif", fontSize: 18, marginBottom: 14 }}>Catering This Week</div>
            {catering.length === 0 ? (
              <p style={{ fontSize: 14, color: "#8a7c6a" }}>No confirmed events this week.</p>
            ) : (
              catering.map(q => (
                <div key={q.id} style={{ padding: "11px 0", borderBottom: "1px solid #f4ecde" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600 }}>
                    <span>{q.name}</span>
                    <span style={{ color: "#a3442e" }}>{q.date}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#6b5d4f", marginTop: 3 }}>
                    {q.package ?? "Catering"} · {q.guests} guests
                  </div>
                </div>
              ))
            )}
            <Link href="/admin/catering" style={{ display: "block", marginTop: 12, fontSize: 13, fontWeight: 700, color: "#c0563d" }}>View all →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
