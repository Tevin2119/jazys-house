export const dynamic = "force-dynamic";

import Link from "next/link";
import type { OrderStatus, Prisma } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/order-status";
import { PageHeader } from "@/components/admin/page-header";
import { SearchInput, SelectFilter } from "@/components/admin/filters";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Title-case a SCREAMING_CASE status for display. */
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
      <PageHeader title="Orders" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search by name or email…" />
        <SelectFilter
          paramKey="status"
          placeholder="All statuses"
          options={ORDER_STATUSES.map((s) => ({
            value: s,
            label: statusLabel(s),
          }))}
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Placed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      #{o.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{o.name ?? "—"}</div>
                    {o.email ? (
                      <div className="text-sm text-muted-foreground">
                        {o.email}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell>{o._count.items}</TableCell>
                  <TableCell>{formatPrice(o.total, o.currency)}</TableCell>
                  <TableCell>{o.createdAt.toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
