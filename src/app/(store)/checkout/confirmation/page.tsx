import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentTenant } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { ClearCart } from "@/components/store/clear-cart";
import { NoStore } from "@/components/store/no-store";
import { OrderCompleteTracker } from "@/components/analytics/order-complete-tracker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false },
};

/** Customer-facing payment line for the order's current status. */
function paymentNote(status: string): string {
  switch (status) {
    case "PENDING":
      return "We're confirming your payment — this page will reflect it shortly.";
    case "PROCESSING":
      return "Payment received! We're getting your order ready.";
    case "SHIPPED":
      return "Your order is on its way.";
    case "DELIVERED":
      return "Your order has been delivered. Enjoy!";
    case "CANCELLED":
      return "This order was cancelled. If that's unexpected, please contact us.";
    default:
      return "We've received your order.";
  }
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; orderId?: string }>;
}) {
  const tenant = await getCurrentTenant();
  if (!tenant) return <NoStore />;

  const { session_id: sessionId, orderId } = await searchParams;

  // Stripe redirects here with ?session_id=. Look the order up by the session id
  // we stored at checkout, scoped to this tenant. The legacy ?orderId= path is
  // kept as a fallback. Either way the lookup is tenant-fenced.
  const order = sessionId
    ? await prisma.order.findFirst({
        where: { stripeSessionId: sessionId, tenantId: tenant.id },
        include: { items: { include: { product: true } } },
      })
    : orderId
      ? await prisma.order.findFirst({
          where: { id: orderId, tenantId: tenant.id },
          include: { items: { include: { product: true } } },
        })
      : null;

  // No matching order (bad/forged session id, wrong store) → back to the cart.
  if (!order) {
    redirect("/cart");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      {/* Order is persisted server-side; empty the client cart now. */}
      <ClearCart />
      <OrderCompleteTracker
        orderId={order.id}
        total={order.total}
        currency={order.currency}
        itemCount={order.items.length}
      />

      <div className="text-center">
        <div className="mb-4 text-6xl">🧡</div>
        <h1 className="font-heading text-4xl font-bold italic">
          Thank you, {order.name?.split(" ")[0] ?? "friend"}!
        </h1>
        <p className="mt-3 text-muted-foreground">
          {paymentNote(order.status)} We&apos;ve sent the details to{" "}
          <strong className="text-foreground">{order.email}</strong>.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Order reference:{" "}
          <span className="font-mono text-foreground">{order.id}</span>
        </p>
      </div>

      <div className="mt-10 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-xl font-bold italic">Order Summary</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span className="text-muted-foreground">
                {item.product.name} × {item.quantity}
              </span>
              <span className="font-medium">
                {formatPrice(item.price * item.quantity, order.currency)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-border pt-4">
          <span className="font-semibold">Total</span>
          <span className="font-bold text-primary">
            {formatPrice(order.total, order.currency)}
          </span>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/shop"
          className="rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
        >
          Continue Shopping →
        </Link>
      </div>
    </div>
  );
}
