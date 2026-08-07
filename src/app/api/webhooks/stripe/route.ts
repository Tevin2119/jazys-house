import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook not configured", { status: 500 });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing stripe-signature header", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await fulfillCheckout(event.data.object as Stripe.Checkout.Session, event.id, event.type);
    } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      await cancelExpiredCheckout(event.data.object as Stripe.Checkout.Session, event.id, event.type);
    } else if (event.type === "refund.updated") {
      await reconcileProviderRefund(event.data.object as Stripe.Refund, event.id);
    } else if (event.type === "charge.refunded") {
      await reconcileRefund(event.data.object as Stripe.Charge, event.id);
    }
  } catch (error) {
    console.error(`[stripe-webhook] ${event.type} failed`, error);
    return new Response("Webhook handler error", { status: 500 });
  }
  return Response.json({ received: true });
}

const orderSelect = {
  id: true, tenantId: true, status: true, total: true, currency: true, stripeSessionId: true,
  stripePaymentIntentId: true, paymentStatus: true,
} satisfies Prisma.OrderSelect;

type OrderRef = Prisma.OrderGetPayload<{ select: typeof orderSelect }>;

async function resolveOrder(session: Stripe.Checkout.Session): Promise<OrderRef | null> {
  const bySession = await prisma.order.findUnique({ where: { stripeSessionId: session.id }, select: orderSelect });
  if (bySession) return bySession;
  const orderId = session.metadata?.orderId;
  if (!orderId) return null;
  const byMetadata = await prisma.order.findUnique({ where: { id: orderId }, select: orderSelect });
  if (!byMetadata || byMetadata.stripeSessionId !== null) return null;
  const claimed = await prisma.order.updateMany({
    where: { id: byMetadata.id, tenantId: byMetadata.tenantId, stripeSessionId: null },
    data: { stripeSessionId: session.id },
  });
  return claimed.count === 1 ? { ...byMetadata, stripeSessionId: session.id } : null;
}

function assertCheckoutMatchesOrder(session: Stripe.Checkout.Session, order: OrderRef): string {
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (
    session.mode !== "payment" ||
    session.payment_status !== "paid" ||
    session.metadata?.orderId !== order.id ||
    session.metadata?.tenantId !== order.tenantId ||
    session.amount_total !== order.total ||
    session.currency?.toLowerCase() !== order.currency.toLowerCase() ||
    session.id !== order.stripeSessionId ||
    !paymentIntentId
  ) {
    throw new Error(`Checkout session ${session.id} does not match order ${order.id}`);
  }
  return paymentIntentId;
}

async function fulfillCheckout(session: Stripe.Checkout.Session, eventId: string, type: string): Promise<void> {
  const order = await resolveOrder(session);
  if (!order) return;
  const paymentIntentId = assertCheckoutMatchesOrder(session, order);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.stripeWebhookEvent.create({ data: { id: eventId, type, orderId: order.id, tenantId: order.tenantId } });
      const updated = await tx.order.updateMany({
        where: { id: order.id, tenantId: order.tenantId, status: "PENDING", stripeSessionId: session.id },
        data: { status: "PROCESSING", stripeEventId: eventId, stripePaymentIntentId: paymentIntentId, paymentId: paymentIntentId, paymentStatus: "COMPLETED", paidAt: new Date() },
      });
      if (updated.count === 1) await tx.orderStatusLog.create({ data: { orderId: order.id, tenantId: order.tenantId, oldStatus: "PENDING", newStatus: "PROCESSING", reason: `Stripe ${type}` } });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
    throw error;
  }
}

async function cancelExpiredCheckout(session: Stripe.Checkout.Session, eventId: string, type: string): Promise<void> {
  const order = await resolveOrder(session);
  if (!order || order.status !== "PENDING" || session.metadata?.orderId !== order.id || session.metadata?.tenantId !== order.tenantId || session.id !== order.stripeSessionId) return;
  const items = await prisma.orderItem.findMany({ where: { orderId: order.id, tenantId: order.tenantId }, select: { productId: true, quantity: true } });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.stripeWebhookEvent.create({ data: { id: eventId, type, orderId: order.id, tenantId: order.tenantId } });
      const cancelled = await tx.order.updateMany({
        where: { id: order.id, tenantId: order.tenantId, status: "PENDING", stripeSessionId: session.id },
        data: { status: "CANCELLED", paymentStatus: "FAILED", stripeEventId: eventId },
      });
      if (cancelled.count !== 1) return;
      for (const item of items) await tx.product.updateMany({ where: { id: item.productId, tenantId: order.tenantId }, data: { stock: { increment: item.quantity } } });
      await tx.orderStatusLog.create({ data: { orderId: order.id, tenantId: order.tenantId, oldStatus: "PENDING", newStatus: "CANCELLED", reason: `Stripe ${type}` } });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
    throw error;
  }
}

async function reconcileRefund(charge: Stripe.Charge, eventId: string): Promise<void> {
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;
  const order = await prisma.order.findUnique({ where: { stripePaymentIntentId: paymentIntentId }, select: orderSelect });
  if (!order) return;
  const refunded = charge.amount_refunded;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.stripeWebhookEvent.create({ data: { id: eventId, type: "charge.refunded", orderId: order.id, tenantId: order.tenantId } });
      if (refunded >= order.total) {
        const updated = await tx.order.updateMany({ where: { id: order.id, tenantId: order.tenantId, status: { not: "REFUNDED" } }, data: { status: "REFUNDED", paymentStatus: "REFUNDED" } });
        if (updated.count === 1) await tx.orderStatusLog.create({ data: { orderId: order.id, tenantId: order.tenantId, oldStatus: order.status, newStatus: "REFUNDED", reason: "Stripe charge.refunded" } });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
    throw error;
  }
}

async function reconcileProviderRefund(refund: Stripe.Refund, eventId: string): Promise<void> {
  const local = await prisma.refund.findUnique({
    where: { providerRefundId: refund.id },
    include: { order: { select: orderSelect } },
  });
  if (!local) return;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.stripeWebhookEvent.create({ data: { id: eventId, type: "refund.updated", orderId: local.orderId, tenantId: local.tenantId } });
      await tx.refund.update({
        where: { id: local.id },
        data: { stage: refund.status === "succeeded" ? "COMPLETED" : "PROCESSING", failureReason: refund.failure_reason ?? null },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
    throw error;
  }
}
