export const dynamic = "force-dynamic";

import type { OrderStatus, Prisma } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/order-status";
import { SearchInput, StatusPillFilter } from "@/components/admin/filters";
import { OrdersDateFilter } from "@/components/admin/orders-date-filter";
import { OrdersTableClient } from "@/components/admin/orders-table-client";

// 48h threshold for the aging dot
const AGING_HOURS = 48;

function dateRangeForFilter(date?: string): Prisma.DateTimeFilter | undefined {
  if (!date) return undefined;
  const now = new Date();
  if (date === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { gte: start };
  }
  if (date === "week") {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { gte: start };
  }
  if (date === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { gte: start };
  }
  return undefined;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; date?: string }>;
}): Promise<React.ReactElement> {
  const { tenantId } = await getAdminContext();
  const { q, status, date } = await searchParams;

  const where: Prisma.OrderWhereInput = { tenantId };
  if (status && (ORDER_STATUSES as string[]).includes(status)) {
    where.status = status as OrderStatus;
  }
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name:  { contains: q, mode: "insensitive" } },
    ];
  }
  const createdAt = dateRangeForFilter(date);
  if (createdAt) where.createdAt = createdAt;

  const orders = await prisma.order.findMany({
    where,
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });

  const agingThreshold = new Date(Date.now() - AGING_HOURS * 60 * 60 * 1000);
  const TERMINAL: OrderStatus[] = ["DELIVERED", "CANCELLED", "REFUNDED"];

  const rows = orders.map((o) => ({
    id:         o.id,
    name:       o.name,
    email:      o.email,
    status:     o.status,
    total:      o.total,
    currency:   o.currency,
    itemCount:  o._count.items,
    createdAt:  o.createdAt.toISOString(),
    isAging:    !TERMINAL.includes(o.status) && o.createdAt < agingThreshold,
  }));

  return (
    <div>
      <h1 style={{ fontFamily: "'Marcellus', serif", fontSize: 30, margin: "0 0 20px", fontWeight: 400 }}>
        Orders
      </h1>

      {/* Status pills */}
      <div style={{ marginBottom: 10 }}>
        <StatusPillFilter
          paramKey="status"
          placeholder="All"
          options={ORDER_STATUSES.map((s) => ({
            value: s,
            label: s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          }))}
        />
      </div>

      {/* Date chips */}
      <div style={{ marginBottom: 14 }}>
        <OrdersDateFilter />
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <SearchInput placeholder="Search by name or email…" />
      </div>

      {/* Table (client for bulk selection) */}
      <OrdersTableClient orders={rows} currency={rows[0]?.currency ?? "gbp"} />
    </div>
  );
}
