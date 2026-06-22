"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";
import { stripe, verifyCart, type CartLine, type VerifiedLine } from "@/lib/stripe";

export interface CheckoutState {
  ok: boolean;
  error?: string;
  /** Stripe Checkout URL (card payments). */
  url?: string;
  /** Order ID returned for non-Stripe payment methods. */
  orderId?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseLines(raw: string): CartLine[] {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return []; }
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

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-tenant-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

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
    console.error("[checkout] failed to restock cancelled order", orderId, err);
  }
}

/**
 * Place an order with Japanese address fields and payment method selection.
 *
 * Card payments → Stripe Checkout (returns url).
 * Non-card payments → order created in PENDING state, returns orderId for
 *   confirmation page. Actual KOMOJU integration wired in a later task (G-69–71).
 */
export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { ok: false, error: "ストアが見つかりません。" };

  // Name
  const lastName  = String(formData.get("lastName")  ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastNameKana  = String(formData.get("lastNameKana")  ?? "").trim();
  const firstNameKana = String(formData.get("firstNameKana") ?? "").trim();
  const name = [lastName, firstName].filter(Boolean).join(" ");

  // Contact
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  // Address
  const postalCode   = String(formData.get("postalCode")   ?? "").trim().replace(/[^0-9]/g, "");
  const prefecture   = String(formData.get("prefecture")   ?? "").trim();
  const city         = String(formData.get("city")         ?? "").trim();
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const addressLine2 = String(formData.get("addressLine2") ?? "").trim();

  const paymentMethod = String(formData.get("paymentMethod") ?? "card").trim();
  const lines = parseLines(String(formData.get("cart") ?? "[]"));

  // Validation
  if (!lastName || !firstName)
    return { ok: false, error: "お名前（姓・名）を入力してください。" };
  if (!EMAIL_RE.test(email))
    return { ok: false, error: "有効なメールアドレスを入力してください。" };
  if (!phone)
    return { ok: false, error: "電話番号を入力してください。" };
  if (!postalCode || !prefecture || !city || !addressLine1)
    return { ok: false, error: "住所を完全に入力してください（郵便番号・都道府県・市区町村・番地）。" };
  if (lines.length === 0)
    return { ok: false, error: "カートが空です。" };

  const address = {
    postalCode,
    prefecture,
    city,
    line1: addressLine1,
    ...(addressLine2 && { line2: addressLine2 }),
    ...(lastNameKana  && { lastNameKana }),
    ...(firstNameKana && { firstNameKana }),
    country: "JP",
  };

  let orderId: string;
  let items: VerifiedLine[];
  try {
    const verified = await verifyCart(tenant.id, lines);
    items = verified.items;
    const subtotal = verified.total;
    const shippingTotal = 0;
    const total = subtotal + shippingTotal;

    const order = await prisma.$transaction(async (tx) => {
      for (const i of items) {
        const res = await tx.product.updateMany({
          where: { id: i.productId, tenantId: tenant.id, stock: { gte: i.quantity } },
          data: { stock: { decrement: i.quantity } },
        });
        if (res.count !== 1) throw new Error(`「${i.name}」の在庫が不足しています`);
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
          address,
          paymentProvider: paymentMethod === "card" ? "STRIPE" : "KOMOJU",
          paymentMethod,
          items: {
            create: items.map((i) => ({
              tenantId: tenant.id,
              productId: i.productId,
              quantity: i.quantity,
              price: i.unitPrice,
            })),
          },
        },
      });
    });
    orderId = order.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : "注文の処理に失敗しました。";
    return { ok: false, error: message };
  }

  // Non-card payments: order is placed in PENDING; return orderId for client redirect.
  // KOMOJU session creation will be wired in a later task.
  if (paymentMethod !== "card") {
    return { ok: true, orderId };
  }

  // Card → Stripe Checkout
  const origin = await requestOrigin();
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: items.map((i) => ({
        quantity: i.quantity,
        price_data: {
          currency: tenant.currency,
          unit_amount: i.unitPrice,
          product_data: { name: i.name },
        },
      })),
      success_url: `${origin}/checkout/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      metadata: { orderId, tenantId: tenant.id },
    });

    if (!session.url) {
      await cancelAndRestock(tenant.id, orderId, items);
      return { ok: false, error: "決済を開始できませんでした。もう一度お試しください。" };
    }

    await prisma.order.updateMany({
      where: { id: orderId, tenantId: tenant.id },
      data: { stripeSessionId: session.id },
    });

    return { ok: true, url: session.url };
  } catch (err) {
    console.error("[checkout] stripe session creation failed", err);
    await cancelAndRestock(tenant.id, orderId, items);
    return { ok: false, error: "決済を開始できませんでした。もう一度お試しください。" };
  }
}
