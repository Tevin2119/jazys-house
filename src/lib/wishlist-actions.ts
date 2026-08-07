"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";

export async function toggleWishlist(
  productId: string,
): Promise<{ wishlisted: boolean }> {
  const session = await auth();
  if (!session) throw new Error("Not authenticated");

  const tenant = await getCurrentTenant();
  if (!tenant) throw new Error("No tenant");

  const userId = session.user.id;

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: tenant.id, deletedAt: null },
    select: { id: true },
  });
  if (!product) throw new Error("Product not found.");

  const existing = await prisma.wishlistItem.findFirst({
    where: { userId, productId, tenantId: tenant.id },
    select: { id: true },
  });

  if (existing) {
    await prisma.wishlistItem.deleteMany({ where: { id: existing.id, userId, tenantId: tenant.id } });
    return { wishlisted: false };
  }

  await prisma.wishlistItem.create({
    data: { tenantId: tenant.id, userId, productId },
  });
  return { wishlisted: true };
}
