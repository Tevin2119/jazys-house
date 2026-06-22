export const dynamic = "force-dynamic";

import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { MetricsClient } from "@/components/admin/metrics-client";

export default async function MetricsPage() {
  const { tenantId } = await getAdminContext();

  const now = new Date();
  const monthStart     = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { currency: true },
  });
  const currency = tenant?.currency ?? "gbp";

  const [
    thisMonthOrders,
    prevMonthOrders,
    totalCustomers,
    newCustomers,
    totalProducts,
    lowStockCount,
    outOfStockCount,
    topProductsRaw,
    ordersByStatus,
    chartOrders,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { tenantId, status: "DELIVERED", createdAt: { gte: monthStart } },
      select: { total: true },
    }),
    prisma.order.findMany({
      where: { tenantId, status: "DELIVERED", createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
      select: { total: true },
    }),
    prisma.order.groupBy({
      by: ["email"],
      where: { tenantId, email: { not: null } },
      _count: true,
    }),
    prisma.order.groupBy({
      by: ["email"],
      where: { tenantId, email: { not: null }, createdAt: { gte: monthStart } },
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
    prisma.order.findMany({
      where: { tenantId, status: "DELIVERED", createdAt: { gte: twelveMonthsAgo } },
      select: { total: true, createdAt: true },
    }),
  ]);

  const thisRev   = thisMonthOrders.reduce((s, o) => s + o.total, 0);
  const prevRev   = prevMonthOrders.reduce((s, o) => s + o.total, 0);
  const thisCount = thisMonthOrders.length;
  const prevCount = prevMonthOrders.length;
  const aov       = thisCount > 0 ? Math.round(thisRev / thisCount) : 0;

  const revPct    = prevRev > 0 ? Math.round(((thisRev - prevRev) / prevRev) * 100) : 0;
  const revChange = prevRev > 0 ? `${revPct >= 0 ? "+" : ""}${revPct}% vs last month` : "No comparison yet";
  const revTrend  = prevRev === 0 ? "neutral" as const : thisRev > prevRev ? "up" as const : thisRev < prevRev ? "down" as const : "neutral" as const;

  const orderChange = prevCount > 0 ? `${thisCount >= prevCount ? "+" : ""}${thisCount - prevCount} vs last month` : "—";
  const orderTrend  = prevCount === 0 ? "neutral" as const : thisCount >= prevCount ? "up" as const : "down" as const;

  const monthLabel = now.toLocaleDateString("en-GB", { month: "long" });

  const kpis = [
    { label: `Revenue · ${monthLabel}`, value: formatPrice(thisRev, currency), sub: revChange, trend: revTrend },
    { label: "Orders This Month", value: String(thisCount), sub: orderChange, trend: orderTrend },
    { label: "Avg Order Value", value: formatPrice(aov, currency), sub: `${thisCount} delivered orders` },
    { label: "New Customers", value: String(newCustomers.length), sub: `${totalCustomers.length} total unique` },
  ];

  // Product names for top products
  const productIds = topProductsRaw.map(tp => tp.productId);
  const productDetails = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const nameMap = Object.fromEntries(productDetails.map(p => [p.id, p.name]));

  const topProducts = topProductsRaw.map(tp => ({
    id: tp.productId,
    name: nameMap[tp.productId] ?? tp.productId.slice(0, 8),
    units: tp._sum.quantity ?? 0,
  }));

  const STATUS_ORDER = ["PENDING", "PROCESSING", "LABEL_CREATED", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED", "REFUNDED"];
  const ordersByStatusForClient = [...ordersByStatus]
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
    .map(s => ({ status: s.status, count: s._count }));

  // 12-month revenue chart
  const revenueChart = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const label = d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    const value = chartOrders
      .filter(o => o.createdAt.getFullYear() === d.getFullYear() && o.createdAt.getMonth() === d.getMonth())
      .reduce((sum, o) => sum + o.total, 0);
    return { month: label, value };
  });

  return (
    <MetricsClient
      currency={currency}
      kpis={kpis}
      revenueChart={revenueChart}
      ordersByStatus={ordersByStatusForClient}
      topProducts={topProducts}
      inventory={{
        inStock: totalProducts - lowStockCount - outOfStockCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
      }}
    />
  );
}
