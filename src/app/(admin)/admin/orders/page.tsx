export const dynamic = "force-dynamic";

import Link from "next/link";
import type { OrderStatus, Prisma } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/order-status";
import { SearchInput, StatusPillFilter } from "@/components/admin/filters";

const ORDER_BADGE: Record<string, { bg: string; color: string }> = {
  PENDING:    { bg: "#fbe5cf", color: "#9a6b1e" },
  PROCESSING: { bg: "#d8e6f5", color: "#2f5d8a" },
  SHIPPED:    { bg: "#e2dcf2", color: "#5a4a9a" },
  DELIVERED:  { bg: "#d8ecd9", color: "#2f6b3a" },
  CANCELLED:  { bg: "#f3dad4", color: "#a3442e" },
};

function statusLabel(status: string): string {
  return status[0] + status.slice(1).toLowerCase();
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}): Promise<React.ReactElement> {
  const { tenantId } = await getAdminContext();
  const { q, status } = await searchParams;

  const where: Prisma.OrderWhereInput = { tenantId };
  if (status && (ORDER_STATUSES as string[]).includes(status)) {
    where.status = status as OrderStatus;
  }
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      {/* Page title */}
      <h1
        style={{
          fontFamily: "'Marcellus', serif",
          fontSize: 30,
          margin: "0 0 16px",
          fontWeight: 400,
        }}
      >
        Orders
      </h1>

      {/* Filter pills */}
      <div style={{ marginBottom: 12 }}>
        <StatusPillFilter
          paramKey="status"
          placeholder="All"
          options={ORDER_STATUSES.map((s) => ({
            value: s,
            label: statusLabel(s),
          }))}
        />
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <SearchInput placeholder="Search by name or email…" />
      </div>

      {/* Mobile card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {orders.length === 0 ? (
          <p style={{ padding: "40px 0", textAlign: "center", color: "#8a7c6a", fontSize: 14 }}>
            No orders found.
          </p>
        ) : (
          orders.map((o) => {
            const badge = ORDER_BADGE[o.status] ?? ORDER_BADGE.PENDING;
            return (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: "#fffdf9",
                    border: "1px solid #ece2d2",
                    borderRadius: 12,
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#2a1f16" }}>
                      #{o.id.slice(0, 6)} · {o.name ?? "—"}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b5d4f", marginTop: 2 }}>
                      {formatPrice(o.total, o.currency)} · {o.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <span
                    style={{
                      background: badge.bg,
                      color: badge.color,
                      padding: "4px 11px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {statusLabel(o.status)}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div
        className="hidden md:block"
        style={{
          background: "#fffdf9",
          border: "1px solid #ece2d2",
          borderRadius: 13,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.8fr 1.6fr 0.6fr 0.8fr 1fr 0.9fr",
            padding: "13px 22px",
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
          <span>Date</span>
        </div>

        {orders.length === 0 ? (
          <div
            style={{
              padding: "40px 22px",
              textAlign: "center",
              color: "#8a7c6a",
              fontSize: 14,
            }}
          >
            No orders found.
          </div>
        ) : (
          orders.map((o) => {
            const badge = ORDER_BADGE[o.status] ?? ORDER_BADGE.PENDING;
            return (
              <div
                key={o.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "0.8fr 1.6fr 0.6fr 0.8fr 1fr 0.9fr",
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
                <span style={{ fontWeight: 700 }}>{formatPrice(o.total, o.currency)}</span>
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
                    {statusLabel(o.status)}
                  </span>
                </span>
                <span style={{ color: "#6b5d4f" }}>
                  {o.createdAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
