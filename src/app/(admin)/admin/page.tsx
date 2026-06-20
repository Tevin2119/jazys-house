export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { OrderStatusBadge, CateringStatusBadge } from "@/components/admin/status-badge";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub: string;
}) {
  return (
    <div
      style={{
        background: "#fffdf9",
        border: "1px solid #ece2d2",
        borderRadius: 13,
        padding: "20px 22px",
      }}
    >
      <div
        style={{
          fontSize: 12,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "#a3442e",
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Marcellus', serif",
          fontSize: 34,
          margin: "8px 0 4px",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: "#6b8a5c", fontWeight: 600 }}>
        {sub}
      </div>
    </div>
  );
}

function StockPill({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span
        style={{
          background: "#f3dad4", color: "#a3442e",
          padding: "3px 11px", borderRadius: 999, fontSize: 12, fontWeight: 700,
        }}
      >Out of stock</span>
    );
  }
  if (stock <= 5) {
    return (
      <span
        style={{
          background: "#fbe5cf", color: "#9a6b1e",
          padding: "3px 11px", borderRadius: 999, fontSize: 12, fontWeight: 700,
        }}
      >{stock} left</span>
    );
  }
  // 6-8: low but not critical — neutral/ok tone
  return (
    <span
      style={{
        background: "#d8ecd9", color: "#2f6b3a",
        padding: "3px 11px", borderRadius: 999, fontSize: 12, fontWeight: 700,
      }}
    >{stock} in stock</span>
  );
}

const ORDER_BADGE: Record<
  string,
  { bg: string; color: string }
> = {
  PENDING:    { bg: "#fbe5cf", color: "#9a6b1e" },
  PROCESSING: { bg: "#d8e6f5", color: "#2f5d8a" },
  SHIPPED:    { bg: "#e2dcf2", color: "#5a4a9a" },
  DELIVERED:  { bg: "#d8ecd9", color: "#2f6b3a" },
  CANCELLED:  { bg: "#f3dad4", color: "#a3442e" },
};

export default async function AdminDashboardPage() {
  const { tenantId, session } = await getAdminContext();

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const monthLabel = now.toLocaleDateString("en-GB", { month: "long" });

  // Month start for revenue
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    productCount,
    categoryCount,
    activeOrders,
    newInquiries,
    monthRevenue,
    totalRevenue,
    recentOrders,
    recentInquiries,
    lowStockProducts,
    tenant,
  ] = await Promise.all([
    prisma.product.count({ where: { tenantId, deletedAt: null } }),
    prisma.category.count({ where: { tenantId } }),
    prisma.order.count({
      where: { tenantId, status: { in: ["PENDING", "PROCESSING", "SHIPPED"] } },
    }),
    prisma.cateringInquiry.count({ where: { tenantId, status: "new" } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        tenantId,
        status: "DELIVERED",
        createdAt: { gte: monthStart },
      },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { tenantId, status: "DELIVERED" },
    }),
    prisma.order.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { _count: { select: { items: true } } },
    }),
    prisma.cateringInquiry.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.product.findMany({
      where: { tenantId, deletedAt: null, stock: { lte: 8 } },
      select: { id: true, name: true, stock: true },
      orderBy: { stock: "asc" },
      take: 5,
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { currency: true },
    }),
  ]);

  const currency = tenant?.currency ?? "gbp";
  const userName = session.user.name;

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: "'Marcellus', serif",
            fontSize: 30,
            margin: "0 0 4px",
            fontWeight: 400,
          }}
        >
          {getGreeting()}{userName ? `, ${userName}` : ""} 👋
        </h1>
        <p style={{ fontSize: 14.5, color: "#6b5d4f", margin: 0 }}>
          Here&apos;s how your store is doing — {dateStr}.
        </p>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 18,
          marginBottom: 26,
        }}
      >
        <StatCard
          label={`Revenue · ${monthLabel}`}
          value={formatPrice(monthRevenue._sum.total ?? 0, currency)}
          sub={`${formatPrice(totalRevenue._sum.total ?? 0, currency)} all-time`}
        />
        <StatCard
          label="Orders"
          value={activeOrders}
          sub={`${activeOrders} awaiting action`}
        />
        <StatCard
          label="Products"
          value={productCount}
          sub={`${categoryCount} ${categoryCount === 1 ? "category" : "categories"}`}
        />
        <StatCard
          label="Inquiries"
          value={newInquiries}
          sub="new this week"
        />
      </div>

      {/* Main 2-col layout: 1.7fr orders + 1fr widgets */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.7fr 1fr",
          gap: 22,
          alignItems: "start",
        }}
        className="max-lg:flex max-lg:flex-col"
      >
        {/* Recent Orders */}
        <div
          style={{
            background: "#fffdf9",
            border: "1px solid #ece2d2",
            borderRadius: 13,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "18px 22px",
              borderBottom: "1px solid #ece2d2",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontFamily: "'Marcellus', serif", fontSize: 19 }}
            >
              Recent Orders
            </span>
            <Link
              href="/admin/orders"
              style={{ fontSize: 13, fontWeight: 700, color: "#c0563d" }}
            >
              View all →
            </Link>
          </div>
          {/* Header row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "0.7fr 1.4fr 0.6fr 0.8fr 1fr",
              padding: "11px 22px",
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#a39685",
              fontWeight: 700,
              borderBottom: "1px solid #f0e8da",
            }}
          >
            <span>Order</span>
            <span>Customer</span>
            <span>Items</span>
            <span>Total</span>
            <span>Status</span>
          </div>
          {recentOrders.length === 0 ? (
            <div
              style={{
                padding: "32px 22px",
                textAlign: "center",
                color: "#a39685",
                fontSize: 14,
              }}
            >
              No orders yet
            </div>
          ) : (
            recentOrders.map((o) => {
              const badge = ORDER_BADGE[o.status] ?? ORDER_BADGE.PENDING;
              return (
                <div
                  key={o.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "0.7fr 1.4fr 0.6fr 0.8fr 1fr",
                    padding: "14px 22px",
                    fontSize: 14,
                    alignItems: "center",
                    borderBottom: "1px solid #f4ecde",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      style={{ color: "#2a1f16", textDecoration: "none" }}
                    >
                      #{o.id.slice(0, 6)}
                    </Link>
                  </span>
                  <span>{o.name ?? o.email ?? "—"}</span>
                  <span style={{ color: "#6b5d4f" }}>{o._count.items}</span>
                  <span style={{ fontWeight: 700 }}>
                    {formatPrice(o.total, o.currency)}
                  </span>
                  <span>
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        padding: "4px 11px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: 0.4,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {o.status.charAt(0) + o.status.slice(1).toLowerCase()}
                    </span>
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Low Stock */}
          <div
            style={{
              background: "#fffdf9",
              border: "1px solid #ece2d2",
              borderRadius: 13,
              padding: "18px 22px",
            }}
          >
            <div
              style={{
                fontFamily: "'Marcellus', serif",
                fontSize: 18,
                marginBottom: 14,
              }}
            >
              Low Stock
            </div>
            {lowStockProducts.length === 0 ? (
              <p style={{ fontSize: 14, color: "#8a7c6a" }}>
                All products well stocked.
              </p>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "9px 0",
                    borderBottom: "1px solid #f4ecde",
                    fontSize: 14,
                  }}
                >
                  <span>{p.name}</span>
                  <StockPill stock={p.stock} />
                </div>
              ))
            )}
          </div>

          {/* Catering Inquiries */}
          <div
            style={{
              background: "#fffdf9",
              border: "1px solid #ece2d2",
              borderRadius: 13,
              padding: "18px 22px",
            }}
          >
            <div
              style={{
                fontFamily: "'Marcellus', serif",
                fontSize: 18,
                marginBottom: 14,
              }}
            >
              Catering Inquiries
            </div>
            {recentInquiries.length === 0 ? (
              <p style={{ fontSize: 14, color: "#8a7c6a" }}>
                No inquiries yet.
              </p>
            ) : (
              recentInquiries.map((q) => (
                <div
                  key={q.id}
                  style={{
                    padding: "11px 0",
                    borderBottom: "1px solid #f4ecde",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    <span>{q.name}</span>
                    <span style={{ color: "#a3442e" }}>{q.date}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#6b5d4f", marginTop: 3 }}>
                    {q.package ?? "Catering"} · {q.guests} guests
                  </div>
                </div>
              ))
            )}
            <Link
              href="/admin/catering"
              style={{
                display: "block",
                marginTop: 12,
                fontSize: 13,
                fontWeight: 700,
                color: "#c0563d",
              }}
            >
              View all →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
