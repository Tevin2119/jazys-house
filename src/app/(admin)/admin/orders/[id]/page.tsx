export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cn, formatPrice } from "@/lib/utils";
import { allowedNextStatuses } from "@/lib/order-status";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { OrderStatusChanger } from "@/components/admin/order-status-changer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Payment state derived from Stripe fields:
 *  - paid     → a webhook recorded the event id (PENDING → PROCESSING happened)
 *  - awaiting → a checkout session exists but no confirming event yet
 *  - none     → no Stripe session (legacy/manual order)
 */
function PaymentBadge({
  hasSession,
  isPaid,
}: {
  hasSession: boolean;
  isPaid: boolean;
}) {
  const { label, className } = isPaid
    ? { label: "Paid", className: "bg-green-100 text-green-800" }
    : hasSession
      ? { label: "Awaiting payment", className: "bg-amber-100 text-amber-800" }
      : { label: "No payment", className: "bg-muted text-muted-foreground" };
  return (
    <Badge variant="outline" className={cn("border-transparent", className)}>
      {label}
    </Badge>
  );
}

/**
 * Render a stored shipping address (a `Prisma.JsonValue`) defensively.
 * Object → one line per string-valued field; anything else → fallback.
 */
function AddressView({ address }: { address: unknown }) {
  if (!address || typeof address !== "object" || Array.isArray(address)) {
    return <p className="text-sm text-muted-foreground">No address</p>;
  }
  const entries = Object.entries(address as Record<string, unknown>);
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No address</p>;
  }
  return (
    <div className="space-y-0.5 text-sm">
      {entries.map(([key, value]) => (
        <div key={key}>
          <span className="text-muted-foreground">{key}:</span>{" "}
          {String(value)}
        </div>
      ))}
    </div>
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { tenantId } = await getAdminContext();
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, tenantId },
    include: { items: { include: { product: true } } },
  });
  if (!order) notFound();

  const isPaid = order.stripeEventId !== null;
  const hasSession = order.stripeSessionId !== null;

  // 4d: an unpaid order can only be CANCELLED from the admin — fulfilment
  // (PROCESSING) is reached via the Stripe payment webhook, never by hand.
  const nextOptions = allowedNextStatuses(order.status).filter((next) =>
    order.status === "PENDING" && next === "PROCESSING" && !isPaid
      ? false
      : true,
  );

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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Line total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.product.name}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(item.price, order.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(item.price * item.quantity, order.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(order.total, order.currency)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="font-medium">{order.name ?? "—"}</div>
              <div className="text-muted-foreground">
                {order.email ?? "—"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping address</CardTitle>
            </CardHeader>
            <CardContent>
              <AddressView address={order.address} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>
                <PaymentBadge hasSession={hasSession} isPaid={isPaid} />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {hasSession ? (
                <div className="space-y-1">
                  <div className="text-muted-foreground">Stripe session</div>
                  <a
                    href={`https://dashboard.stripe.com/search?query=${order.stripeSessionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block break-all font-mono text-xs text-primary underline-offset-2 hover:underline"
                  >
                    {order.stripeSessionId}
                  </a>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No Stripe session linked to this order.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>
                <OrderStatusBadge status={order.status} />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <OrderStatusChanger
                id={order.id}
                current={order.status}
                nextOptions={nextOptions}
              />
              {order.status === "PENDING" && !isPaid ? (
                <p className="text-xs text-muted-foreground">
                  Awaiting payment — fulfilment unlocks once Stripe confirms the
                  charge.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
