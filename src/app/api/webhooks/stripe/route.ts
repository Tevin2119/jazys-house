import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

// Prisma cannot run on the Edge runtime — pin this handler to Node.
export const runtime = "nodejs";
// Webhooks are inherently dynamic; never cache.
export const dynamic = "force-dynamic";

/**
 * Stripe webhook receiver.
 *
 * SECURITY: every request is verified against STRIPE_WEBHOOK_SECRET using the
 * raw request body. An unsigned / mis-signed request is rejected with 400 before
 * any DB work — without this anyone could POST a fake "payment succeeded" event.
 *
 * IDEMPOTENCY (COUNCIL H2/webhook): Stripe delivers each event at-least-once and
 * retries on non-2xx. We record the processed event id on the order
 * (`stripeEventId`) and short-circuit if we see the same id again, so a payment
 * is never double-applied.
 *
 * RESPONSE CONTRACT: we return 200 for any event we successfully receive and
 * acknowledge — both the types we act on and the ones we intentionally ignore.
 * Returning a 4xx for an *unhandled type* would make Stripe retry that event for
 * up to ~3 days, which is the documented anti-pattern. 400 is reserved for a
 * genuinely bad request (missing/invalid signature or unparseable body).
 */
export async function POST(req: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return new Response("Webhook not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  // The signature is computed over the EXACT raw bytes — read text, not JSON.
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid signature";
    console.error("[stripe-webhook] signature verification failed:", message);
    return new Response(`Webhook signature verification failed: ${message}`, {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
          event.id,
        );
        break;

      case "checkout.session.expired":
        // Customer abandoned checkout — release the stock we reserved so it does
        // not stay locked behind an order that can never be paid.
        await handleCheckoutExpired(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "payment_intent.payment_failed":
        // Stub: the order stays PENDING. A failed payment intent does not (yet)
        // auto-cancel the order — the customer may retry from the same session.
        console.warn(
          "[stripe-webhook] payment_failed",
          (event.data.object as Stripe.PaymentIntent).id,
        );
        break;

      case "charge.refunded":
        // Stub: refunds are reconciled manually for now. Logged for visibility.
        console.warn(
          "[stripe-webhook] charge.refunded",
          (event.data.object as Stripe.Charge).id,
        );
        break;

      default:
        // Unhandled but validly-signed event — acknowledge so Stripe stops retrying.
        break;
    }
  } catch (err) {
    // A processing error (e.g. DB hiccup) SHOULD be retried by Stripe → 500.
    console.error(`[stripe-webhook] error handling ${event.type}:`, err);
    return new Response("Webhook handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

type OrderRef = {
  id: string;
  tenantId: string;
  status: string;
  stripeSessionId: string | null;
  stripeEventId: string | null;
};

/**
 * Resolve our Order for a Stripe session.
 *
 * Primary key is the `stripeSessionId` we store at checkout. As a safety net we
 * fall back to `metadata.orderId`: if the post-checkout `stripeSessionId` write
 * ever failed (process died between Stripe returning and the DB commit), the
 * paid order would otherwise be unreachable and stuck PENDING forever. The
 * fallback heals that — and backfills the missing session id.
 */
async function resolveOrder(
  session: Stripe.Checkout.Session,
): Promise<OrderRef | null> {
  const select = {
    id: true,
    tenantId: true,
    status: true,
    stripeSessionId: true,
    stripeEventId: true,
  };

  const bySession = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
    select,
  });
  if (bySession) return bySession;

  const orderId = session.metadata?.orderId;
  if (!orderId) return null;

  const byMeta = await prisma.order.findUnique({ where: { id: orderId }, select });
  if (byMeta && byMeta.stripeSessionId === null) {
    // Backfill the session id we failed to persist at checkout.
    await prisma.order.updateMany({
      where: { id: byMeta.id, tenantId: byMeta.tenantId, stripeSessionId: null },
      data: { stripeSessionId: session.id },
    });
  }
  return byMeta;
}

/**
 * Defence-in-depth tenant fence: the session metadata MUST carry a tenantId and
 * it MUST match the order's tenant. Fail closed — a missing or mismatched
 * tenantId means a tampered/cross-wired event, so we refuse to mutate.
 */
function assertTenantMatch(
  session: Stripe.Checkout.Session,
  order: OrderRef,
): void {
  const metaTenantId = session.metadata?.tenantId;
  if (!metaTenantId || metaTenantId !== order.tenantId) {
    throw new Error(
      `tenant fence failed for session ${session.id}: meta=${metaTenantId ?? "<none>"} order=${order.tenantId}`,
    );
  }
}

/**
 * Mark an order paid: PENDING → PROCESSING. Idempotent and tenant-checked.
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  eventId: string,
): Promise<void> {
  const order = await resolveOrder(session);
  if (!order) {
    // Could be an event from another environment sharing this endpoint. Ack it.
    console.warn("[stripe-webhook] no order for session", session.id);
    return;
  }

  // Idempotency: this exact event already applied → nothing to do.
  if (order.stripeEventId === eventId) return;

  assertTenantMatch(session, order);

  // Conditional (compare-and-swap) transition: only a PENDING order advances to
  // PROCESSING. Concurrent duplicate delivery → count 0, no double-apply. The
  // @unique on stripeEventId is the DB-level backstop against double-recording.
  const res = await prisma.order.updateMany({
    where: { id: order.id, tenantId: order.tenantId, status: "PENDING" },
    data: { status: "PROCESSING", stripeEventId: eventId },
  });

  // Already advanced/cancelled by a prior event: still record this event id so
  // future duplicate deliveries of THIS event short-circuit above.
  if (res.count === 0) {
    await prisma.order.updateMany({
      where: { id: order.id, tenantId: order.tenantId },
      data: { stripeEventId: eventId },
    });
  }
}

/**
 * Release reserved stock when a checkout session expires unpaid. Cancels the
 * still-PENDING order and returns each line's quantity to its product, in one
 * transaction. No-op if the order already moved on (paid/cancelled).
 */
async function handleCheckoutExpired(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const order = await resolveOrder(session);
  if (!order || order.status !== "PENDING") return;

  const items = await prisma.orderItem.findMany({
    where: { orderId: order.id, tenantId: order.tenantId },
    select: { productId: true, quantity: true },
  });

  await prisma.$transaction(async (tx) => {
    // Only the order still PENDING gets cancelled — guards against a payment that
    // landed between our read and this write.
    const res = await tx.order.updateMany({
      where: { id: order.id, tenantId: order.tenantId, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    if (res.count !== 1) return; // someone else advanced it; leave stock alone
    for (const i of items) {
      await tx.product.updateMany({
        where: { id: i.productId, tenantId: order.tenantId },
        data: { stock: { increment: i.quantity } },
      });
    }
  });
}
