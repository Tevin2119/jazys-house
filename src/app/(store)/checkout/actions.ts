"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";
import { stripe, verifyCart, type CartLine, type VerifiedLine } from "@/lib/stripe";

export interface CheckoutState {
  ok: boolean;
  error?: string;
  /** Stripe Checkout URL — when present, the client redirects the browser here. */
  url?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Parse the client cart payload into trusted {productId, quantity} lines. */
function parseLines(raw: string): CartLine[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const lines: CartLine[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") continue;
    const productId = (entry as Record<string, unknown>).productId;
    const quantity = (entry as Record<string, unknown>).quantity;
    if (typeof productId === "string" && Number.isInteger(quantity)) {
      lines.push({ productId, quantity: quantity as number });
    }
  }
  return lines;
}

/**
 * Build the absolute origin for Stripe redirect URLs.
 * Prefer the request host so the customer returns to the SAME storefront they
 * checked out from (tenant subdomain / custom domain). Falls back to the
 * configured app URL for contexts without a host header.
 */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-tenant-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/**
 * Compensating action: cancel an order and return its reserved stock.
 *
 * Called when Stripe session creation fails AFTER the order + stock decrement
 * have committed. Without this the stock would be silently lost (reserved for an
 * order that can never be paid).
 */
async function cancelAndRestock(
  tenantId: string,
  orderId: string,
  items: VerifiedLine[],
): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      for (const i of items) {
        await tx.product.updateMany({
          where: { id: i.productId, tenantId },
          data: { stock: { increment: i.quantity } },
        });
      }
      await tx.order.updateMany({
        where: { id: orderId, tenantId, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
    });
  } catch (err) {
    // Last-resort: log so the order can be reconciled manually. Never throw from
    // a compensating path — the caller is already returning an error to the user.
    console.error("[checkout] failed to restock cancelled order", orderId, err);
  }
}

/**
 * Place an order and start Stripe Checkout.
 *
 * Trust boundary (COUNCIL C1/C2): the tenant is resolved from the host, the cart
 * is re-priced against the DB via `verifyCart` (client prices are ignored), and
 * every OrderItem carries the tenantId so order lines can never reference another
 * store's products.
 *
 * COUNCIL H2 (stock oversell): the order + per-line stock decrement run in a
 * single interactive transaction. Each decrement is a conditional write
 * (`stock >= quantity`); if any line is short, the whole transaction rolls back
 * and no order is created. This is atomic — never check-then-write.
 */
export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { ok: false, error: "Store not found for this address." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const line1 = String(formData.get("address1") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const lines = parseLines(String(formData.get("cart") ?? "[]"));

  if (!name || !email || !line1 || !city || !postalCode || !country) {
    return { ok: false, error: "Please complete every shipping field." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (lines.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  let orderId: string;
  let items: VerifiedLine[];
  try {
    // Authoritative re-pricing from the DB (throws on missing/oversold lines).
    const verified = await verifyCart(tenant.id, lines);
    items = verified.items;
    const subtotal = verified.total; // item lines before shipping
    const shippingTotal = 0; // shipping calculated post-checkout for now
    const total = subtotal + shippingTotal;

    const order = await prisma.$transaction(async (tx) => {
      // H2: atomic conditional stock decrement, one line at a time. The
      // `stock: { gte: quantity }` guard means a concurrent order that drained
      // the shelf makes count === 0 here, which throws and rolls everything back.
      for (const i of items) {
        const res = await tx.product.updateMany({
          where: { id: i.productId, tenantId: tenant.id, stock: { gte: i.quantity } },
          data: { stock: { decrement: i.quantity } },
        });
        if (res.count !== 1) {
          throw new Error(`Insufficient stock for ${i.name}`);
        }
      }

      return tx.order.create({
        data: {
          tenantId: tenant.id,
          status: "PENDING",
          subtotal,
          shippingTotal,
          total,
          currency: tenant.currency,
          name,
          email,
          phone: phone || undefined,
          address: {
            line1,
            city,
            postalCode,
            country,
            ...(phone && { phone }),
          },
          items: {
            create: items.map((i) => ({
              // C2: every line is scoped to the same tenant as the order.
              tenantId: tenant.id,
              productId: i.productId,
              quantity: i.quantity,
              price: i.unitPrice, // snapshot at time of order
            })),
          },
        },
      });
    });
    orderId = order.id;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not place your order.";
    return { ok: false, error: message };
  }

  // Order + stock are committed. Create the Stripe Checkout session from the
  // VERIFIED line items (never the client payload).
  const origin = await requestOrigin();
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: items.map((i) => ({
        quantity: i.quantity,
        price_data: {
          currency: tenant.currency,
          unit_amount: i.unitPrice, // already minor units
          product_data: { name: i.name },
        },
      })),
      success_url: `${origin}/checkout/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      // The webhook trusts these to bind the session back to our order + tenant.
      metadata: { orderId, tenantId: tenant.id },
    });

    if (!session.url) {
      await cancelAndRestock(tenant.id, orderId, items);
      return { ok: false, error: "Could not start payment. Please try again." };
    }

    await prisma.order.updateMany({
      where: { id: orderId, tenantId: tenant.id },
      data: { stripeSessionId: session.id },
    });

    return { ok: true, url: session.url };
  } catch (err) {
    console.error("[checkout] stripe session creation failed", err);
    await cancelAndRestock(tenant.id, orderId, items);
    return { ok: false, error: "Could not start payment. Please try again." };
  }
}
