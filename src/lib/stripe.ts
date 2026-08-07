import "server-only";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

// SECURITY: this module is server-only. The Stripe secret key must NEVER reach
// the client bundle. Importing it from a Client Component will fail the build.
const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (!stripeSecret) {
  // Don't throw at import time during build/scaffold; surface clearly when used.
  console.warn(
    "[stripe] STRIPE_SECRET_KEY is not set — checkout/webhooks will fail until configured.",
  );
}

export const stripe = new Stripe(stripeSecret ?? "sk_test_placeholder", {
  // Pin the API version for predictable behavior across deploys.
  apiVersion: "2025-02-24.acacia",
  appInfo: { name: "Jazy's House Platform" },
});

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface VerifiedLine {
  productId: string;
  name: string;
  /** Authoritative unit price in minor units, read from the DB. */
  unitPrice: number;
  quantity: number;
}

/**
 * COUNCIL FIX (Phase 4 stub): server-side price verification.
 *
 * NEVER trust prices, names, or totals sent from the browser. At checkout we
 * re-read every product from the DB (scoped to the tenant), recompute the line
 * prices and the order total from authoritative data, and build the Stripe
 * session from THAT — not from the client payload.
 *
 * This is a stub for Phase 1: it implements the verification contract so Phase 4
 * can plug in Stripe session creation without re-litigating trust boundaries.
 */
export async function verifyCart(
  tenantId: string,
  lines: CartLine[],
): Promise<{ items: VerifiedLine[]; total: number }> {
  if (lines.length === 0 || lines.length > 50) {
    return { items: [], total: 0 };
  }

  const quantities = new Map<string, number>();
  for (const line of lines) {
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 100) {
      throw new Error("Invalid item quantity.");
    }
    quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
  }
  const normalizedLines = [...quantities].map(([productId, quantity]) => ({ productId, quantity }));

  const products = await prisma.product.findMany({
    where: {
      tenantId,
      deletedAt: null,
      id: { in: normalizedLines.map((l) => l.productId) },
    },
    select: { id: true, name: true, price: true, stock: true },
  });

  const byId = new Map(products.map((p) => [p.id, p]));
  const items: VerifiedLine[] = [];

  for (const line of normalizedLines) {
    const product = byId.get(line.productId);
    if (!product) {
      throw new Error(`Product not found for tenant: ${line.productId}`);
    }
    if (line.quantity < 1) {
      throw new Error(`Invalid quantity for ${product.name}`);
    }
    if (line.quantity > product.stock) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }
    items.push({
      productId: product.id,
      name: product.name,
      unitPrice: product.price, // authoritative, from DB
      quantity: line.quantity,
    });
  }

  const total = items.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0,
  );

  if (!Number.isSafeInteger(total) || total < 0 || total > 2_000_000_000) {
    throw new Error("Order total is outside supported bounds.");
  }
  return { items, total };
}
