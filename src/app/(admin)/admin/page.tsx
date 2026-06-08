export const dynamic = "force-dynamic";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Package,
  PoundSterling,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import {
  OrderStatusBadge,
  CateringStatusBadge,
} from "@/components/admin/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Compact stat tile for the dashboard header grid. */
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardDescription>{label}</CardDescription>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const { tenantId, session } = await getAdminContext();

  const [
    productCount,
    activeOrders,
    newInquiries,
    revenueAgg,
    recentOrders,
    recentInquiries,
    tenant,
  ] = await Promise.all([
    prisma.product.count({ where: { tenantId, deletedAt: null } }),
    prisma.order.count({
      where: { tenantId, status: { in: ["PENDING", "PROCESSING", "SHIPPED"] } },
    }),
    prisma.cateringInquiry.count({ where: { tenantId, status: "new" } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { tenantId, status: "DELIVERED" },
    }),
    prisma.order.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.cateringInquiry.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { currency: true },
    }),
  ]);

  const currency = tenant?.currency ?? "gbp";
  const greeting = session.user.name ? `, ${session.user.name}` : "";

  return (
    <div>
      <PageHeader title="Dashboard" description={`Welcome back${greeting}.`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Products"
          value={productCount}
          icon={<Package className="size-4" />}
        />
        <StatCard
          label="Active orders"
          value={activeOrders}
          icon={<ShoppingCart className="size-4" />}
        />
        <StatCard
          label="New inquiries"
          value={newInquiries}
          icon={<UtensilsCrossed className="size-4" />}
        />
        <StatCard
          label="Revenue (delivered)"
          value={formatPrice(revenueAgg._sum.total ?? 0, currency)}
          icon={<PoundSterling className="size-4" />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No orders yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="hover:underline"
                        >
                          #{order.id.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {order.name ?? order.email ?? "—"}
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(order.total, order.currency)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Link
              href="/admin/orders"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New catering inquiries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInquiries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No inquiries yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentInquiries.map((inquiry) => (
                    <TableRow key={inquiry.id}>
                      <TableCell className="font-medium">
                        {inquiry.name}
                      </TableCell>
                      <TableCell>{inquiry.date}</TableCell>
                      <TableCell>{inquiry.guests}</TableCell>
                      <TableCell>
                        <CateringStatusBadge status={inquiry.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Link
              href="/admin/catering"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
