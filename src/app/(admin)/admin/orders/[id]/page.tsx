export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { allowedNextStatuses } from "@/lib/order-status";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { OrderDetailTabs } from "@/components/admin/order-detail-tabs";
import type { OrderDetailData } from "@/components/admin/order-detail-tabs";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { tenantId } = await getAdminContext();
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, tenantId },
    include: {
      items:      { include: { product: true } },
      shipments:  { include: { events: { orderBy: { timestamp: "asc" } } } },
      messages:   { orderBy: { createdAt: "asc" } },
      statusLogs: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();

  const isPaid      = order.paymentStatus === "COMPLETED" || order.paymentStatus === "REFUNDED";
  const hasSession  = order.stripeSessionId !== null;

  const nextOptions = allowedNextStatuses(order.status).filter((next) =>
    order.status === "PENDING" && next === "PROCESSING" && !isPaid ? false : true,
  );

  // Serialise Dates → ISO strings so the client component receives plain JSON.
  const orderData: OrderDetailData = {
    id:              order.id,
    status:          order.status,
    total:           order.total,
    subtotal:        order.subtotal,
    shippingTotal:   order.shippingTotal,
    currency:        order.currency,
    email:           order.email,
    name:            order.name,
    phone:           order.phone,
    address:         order.address,
    stripeSessionId: order.stripeSessionId,
    paymentProvider: order.paymentProvider,
    paymentMethod:   order.paymentMethod,
    paymentStatus:   order.paymentStatus,
    isPaid,
    hasSession,
    items: order.items.map((item) => ({
      id:          item.id,
      productName: item.product.name,
      quantity:    item.quantity,
      price:       item.price,
    })),
    shipments: order.shipments.map((s) => ({
      id:             s.id,
      carrier:        s.carrier,
      trackingNumber: s.trackingNumber,
      status:         s.status,
      createdAt:      s.createdAt.toISOString(),
      events: s.events.map((ev) => ({
        id:          ev.id,
        status:      ev.status,
        location:    ev.location,
        description: ev.description,
        timestamp:   ev.timestamp.toISOString(),
      })),
    })),
    messages: order.messages.map((m) => ({
      id:         m.id,
      content:    m.content,
      side:       m.side,
      senderName: m.senderName,
      isInternal: m.isInternal,
      createdAt:  m.createdAt.toISOString(),
    })),
    statusLogs: order.statusLogs.map((l) => ({
      id:        l.id,
      oldStatus: l.oldStatus,
      newStatus: l.newStatus,
      changedBy: l.changedBy,
      createdAt: l.createdAt.toISOString(),
    })),
  };

  return (
    <div>
      <PageHeader
        title={`Order #${order.id.slice(0, 8)}`}
        action={
          <>
            <OrderStatusBadge status={order.status} />
            <Button variant="outline" asChild>
              <Link href="/admin/orders">Back</Link>
            </Button>
          </>
        }
      />

      <OrderDetailTabs order={orderData} nextOptions={nextOptions} />
    </div>
  );
}
