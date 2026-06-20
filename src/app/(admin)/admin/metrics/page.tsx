export const dynamic = "force-dynamic";

import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

interface MetricCard {
  label: string;
  value: string;
  sub: string;
  trend?: "up" | "down" | "neutral";
}

export default async function MetricsPage() {
  const { tenantId } = await getAdminContext();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { currency: true },
  });
  const currency = tenant?.currency ?? "gbp";

  const [
    thisMonthRevenue,
    prevMonthRevenue,
    thisMonthOrders,
    prevMonthOrders,
    totalCustomers,
    totalProducts,
    lowStockCount,
    outOfStockCount,
    topProducts,
    ordersByStatus,
    newSignups,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true },
      where: { tenantId, status: "DELIVERED", createdAt: { gte: monthStart } },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        tenantId,
        status: "DELIVERED",
        createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
      },
    }),
    prisma.order.count({ where: { tenantId, createdAt: { gte: monthStart } } }),
    prisma.order.count({
      where: { tenantId, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
    }),
    prisma.order.groupBy({
      by: ["email"],
      where: { tenantId, email: { not: null } },
      _count: true,
    }),
    prisma.product.count({ where: { tenantId, deletedAt: null } }),
    prisma.product.count({ where: { tenantId, deletedAt: null, stock: { gt: 0, lte: 8 } } }),
    prisma.product.count({ where: { tenantId, deletedAt: null, stock: 0 } }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { tenantId },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    }),
    prisma.newsletterSignup.count({
      where: { tenantId, createdAt: { gte: monthStart } },
    }),
  ]);

  // Fetch product names for top products
  const topProductIds = topProducts.map((tp) => tp.productId);
  const topProductDetails = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true },
  });
  const productNameMap = Object.fromEntries(
    topProductDetails.map((p) => [p.id, p.name])
  );

  const thisRev = thisMonthRevenue._sum.total ?? 0;
  const prevRev = prevMonthRevenue._sum.total ?? 0;
  const revChange =
    prevRev > 0
      ? `${thisRev > prevRev ? "+" : ""}${Math.round(((thisRev - prevRev) / prevRev) * 100)}% vs last month`
      : "No comparison available";

  const orderChange =
    prevMonthOrders > 0
      ? `${thisMonthOrders > prevMonthOrders ? "+" : ""}${thisMonthOrders - prevMonthOrders} vs last month`
      : "—";

  const statusOrder: Record<string, number> = {
    PENDING: 0,
    PROCESSING: 1,
    SHIPPED: 2,
    DELIVERED: 3,
    CANCELLED: 4,
  };
  const statusColors: Record<string, { bg: string; color: string }> = {
    PENDING:    { bg: "#fbe5cf", color: "#9a6b1e" },
    PROCESSING: { bg: "#d8e6f5", color: "#2f5d8a" },
    SHIPPED:    { bg: "#e2dcf2", color: "#5a4a9a" },
    DELIVERED:  { bg: "#d8ecd9", color: "#2f6b3a" },
    CANCELLED:  { bg: "#f3dad4", color: "#a3442e" },
  };

  const sortedStatuses = [...ordersByStatus].sort(
    (a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
  );

  const metrics: MetricCard[] = [
    {
      label: `Revenue · ${now.toLocaleDateString("en-GB", { month: "long" })}`,
      value: formatPrice(thisRev, currency),
      sub: revChange,
    },
    {
      label: "Orders This Month",
      value: String(thisMonthOrders),
      sub: orderChange,
    },
    {
      label: "Total Customers",
      value: String(totalCustomers.length),
      sub: "unique emails from orders",
    },
    {
      label: "Newsletter Signups",
      value: String(newSignups),
      sub: "this month",
    },
  ];

  return (
    <div>
      <h1
        style={{
          fontFamily: "'Marcellus', serif",
          fontSize: 30,
          margin: "0 0 4px",
          fontWeight: 400,
        }}
      >
        Metrics
      </h1>
      <p style={{ fontSize: 14, color: "#6b5d4f", margin: "0 0 24px" }}>
        Store performance at a glance.
      </p>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 18,
          marginBottom: 26,
        }}
      >
        {metrics.map((m) => (
          <div
            key={m.label}
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
              {m.label}
            </div>
            <div
              style={{
                fontFamily: "'Marcellus', serif",
                fontSize: 34,
                margin: "8px 0 4px",
                color: "#2a1f16",
              }}
            >
              {m.value}
            </div>
            <div style={{ fontSize: 12.5, color: "#6b8a5c", fontWeight: 600 }}>
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* 2-col: Order status breakdown + Top products */}
      <div
        className="max-lg:flex max-lg:flex-col"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 22,
          alignItems: "start",
          marginBottom: 26,
        }}
      >
        {/* Order status breakdown */}
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
              fontFamily: "'Marcellus', serif",
              fontSize: 17,
            }}
          >
            Orders by Status
          </div>
          {sortedStatuses.map((s) => {
            const badge = statusColors[s.status] ?? { bg: "#f0e8da", color: "#8a7c6a" };
            return (
              <div
                key={s.status}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 22px",
                  borderBottom: "1px solid #f4ecde",
                  fontSize: 14,
                }}
              >
                <span
                  style={{
                    background: badge.bg,
                    color: badge.color,
                    padding: "3px 11px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {s.status}
                </span>
                <span style={{ fontWeight: 700 }}>{s._count}</span>
              </div>
            );
          })}
        </div>

        {/* Top products */}
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
              fontFamily: "'Marcellus', serif",
              fontSize: 17,
            }}
          >
            Top Products by Units Sold
          </div>
          {topProducts.length === 0 ? (
            <div style={{ padding: "24px 22px", color: "#8a7c6a", fontSize: 14 }}>
              No sales data yet.
            </div>
          ) : (
            topProducts.map((tp, i) => (
              <div
                key={tp.productId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 22px",
                  borderBottom: "1px solid #f4ecde",
                  fontSize: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "#f3ede2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#6b5d4f",
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {productNameMap[tp.productId] ?? tp.productId.slice(0, 8)}
                  </span>
                </div>
                <span style={{ color: "#6b5d4f" }}>
                  {tp._sum.quantity ?? 0} units
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Inventory health */}
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
            fontSize: 17,
            marginBottom: 14,
          }}
        >
          Inventory Health
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
          <div
            style={{
              background: "#d8ecd9",
              borderRadius: 10,
              padding: "14px 18px",
              color: "#2f6b3a",
            }}
          >
            <div style={{ fontSize: 28, fontFamily: "'Marcellus', serif", fontWeight: 400 }}>
              {totalProducts - lowStockCount - outOfStockCount}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>In Stock</div>
          </div>
          <div
            style={{
              background: "#fbe5cf",
              borderRadius: 10,
              padding: "14px 18px",
              color: "#9a6b1e",
            }}
          >
            <div style={{ fontSize: 28, fontFamily: "'Marcellus', serif", fontWeight: 400 }}>
              {lowStockCount}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>Low Stock</div>
          </div>
          <div
            style={{
              background: "#f3dad4",
              borderRadius: 10,
              padding: "14px 18px",
              color: "#a3442e",
            }}
          >
            <div style={{ fontSize: 28, fontFamily: "'Marcellus', serif", fontWeight: 400 }}>
              {outOfStockCount}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>Out of Stock</div>
          </div>
        </div>
      </div>
    </div>
  );
}
