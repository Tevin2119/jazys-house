"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";
import { assertRateLimit } from "@/lib/rate-limit";
import { stripe, verifyCart, type CartLine, type VerifiedLine } from "@/lib/stripe";

export interface CheckoutState {
  ok: boolean;
  error?: string;
  url?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TEXT_LENGTH = 200;

function parseLines(raw: string): CartLine[] {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return []; }
  if (!Array.isArray(parsed) || parsed.length > 50) return [];
  return parsed.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const { productId, quantity } = entry as Record<string, unknown>;
    return typeof productId === "string" && productId.length <= 64 && Number.isSafeInteger(quantity)
      ? [{ productId, quantity: quantity as number }]
      : [];
  });
}

async function requestOrigin(tenantDomain: string | null): Promise<string> {
  const h = await headers();
  const host = h.get("x-tenant-host")?.toLowerCase().replace(/:\d+$/, "");
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase().replace(/:\d+$/, "");
  const trusted = host && (host === tenantDomain?.toLowerCase() || host === rootDomain || Boolean(rootDomain && host.endsWith(`.${rootDomain}`)));
  if (trusted) return `${process.env.NODE_ENV === "production" ? "https" : "http"}://${h.get("x-tenant-host")}`;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function cancelAndRestock(tenantId: string, orderId: string, items: VerifiedLine[]): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      const cancelled = await tx.order.updateMany({
        where: { id: orderId, tenantId, status: "PENDING" },
        data: { status: "CANCELLED", paymentStatus: "FAILED" },
      });
      if (cancelled.count !== 1) return;
      for (const item of items) {
        await tx.product.updateMany({
          where: { id: item.productId, tenantId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });
  } catch (error) {
    console.error("[checkout] failed to compensate order", orderId, error);
  }
}

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  await assertRateLimit("checkout", 5, 10 * 60_000);
  const tenant = await getCurrentTenant();
  if (!tenant) return { ok: false, error: "ストアが見つかりません。" };

  const value = (name: string) => String(formData.get(name) ?? "").trim();
  const lastName = value("lastName");
  const firstName = value("firstName");
  const email = value("email").toLowerCase();
  const phone = value("phone");
  const postalCode = value("postalCode").replace(/[^0-9]/g, "");
  const prefecture = value("prefecture");
  const city = value("city");
  const addressLine1 = value("addressLine1");
  const addressLine2 = value("addressLine2");
  const paymentMethod = value("paymentMethod");
  const checkoutAttemptId = value("checkoutAttemptId");
  const lines = parseLines(value("cart"));

  if (paymentMethod !== "card") return { ok: false, error: "この決済方法は現在利用できません。" };
  if (!/^[0-9a-f-]{36}$/i.test(checkoutAttemptId)) return { ok: false, error: "チェックアウトを最初からやり直してください。" };
  if (!lastName || !firstName || !EMAIL_RE.test(email) || !phone || postalCode.length !== 7 || !prefecture || !city || !addressLine1 || !lines.length) {
    return { ok: false, error: "入力内容を確認してください。" };
  }
  if ([lastName, firstName, phone, prefecture, city, addressLine1, addressLine2].some((text) => text.length > MAX_TEXT_LENGTH)) {
    return { ok: false, error: "入力内容が長すぎます。" };
  }

  const verified = await verifyCart(tenant.id, lines);
  let items = verified.items;
  let total = verified.total;
  const existing = await prisma.order.findUnique({
    where: { checkoutAttemptId },
    include: { items: { include: { product: { select: { name: true } } } } },
  });
  if (existing) {
    if (existing.tenantId !== tenant.id || existing.email !== email || existing.status === "CANCELLED") {
      return { ok: false, error: "このチェックアウトは再利用できません。ページを更新してやり直してください。" };
    }
    if (existing.stripeSessionId) {
      const session = await stripe.checkout.sessions.retrieve(existing.stripeSessionId);
      if (session.url) return { ok: true, url: session.url };
    }
    // A retry must charge the exact immutable order snapshot, not a cart that
    // changed after the original reservation was created.
    items = existing.items.map((item) => ({ productId: item.productId, name: item.product.name, unitPrice: item.price, quantity: item.quantity }));
    total = existing.total;
  }

  let orderId = existing?.id;
  if (!orderId) {
    try {
      const order = await prisma.$transaction(async (tx) => {
        for (const item of items) {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, tenantId: tenant.id, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count !== 1) throw new Error(`「${item.name}」の在庫が不足しています`);
        }
        return tx.order.create({
          data: {
            tenantId: tenant.id, checkoutAttemptId, status: "PENDING", paymentProvider: "STRIPE", paymentMethod: "card", paymentStatus: "PENDING",
            subtotal: total, shippingTotal: 0, total, currency: tenant.currency, name: `${lastName} ${firstName}`, email, phone,
            address: { postalCode, prefecture, city, line1: addressLine1, ...(addressLine2 ? { line2: addressLine2 } : {}), country: "JP" },
            items: { create: items.map((item) => ({ tenantId: tenant.id, productId: item.productId, quantity: item.quantity, price: item.unitPrice })) },
          },
        });
      });
      orderId = order.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : "注文の処理に失敗しました。";
      return { ok: false, error: message };
    }
  }

  const origin = await requestOrigin(tenant.domain);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: items.map((item) => ({ quantity: item.quantity, price_data: { currency: tenant.currency, unit_amount: item.unitPrice, product_data: { name: item.name } } })),
      success_url: `${origin}/checkout/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      metadata: { orderId, tenantId: tenant.id },
    }, { idempotencyKey: `checkout:${orderId}` });
    if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
    await prisma.order.updateMany({ where: { id: orderId, tenantId: tenant.id, stripeSessionId: null }, data: { stripeSessionId: session.id } });
    return { ok: true, url: session.url };
  } catch (error) {
    console.error("[checkout] Stripe session creation failed", error);
    await cancelAndRestock(tenant.id, orderId, items);
    return { ok: false, error: "決済を開始できませんでした。もう一度お試しください。" };
  }
}
