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

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.wishlistItem.delete({
      where: { userId_productId: { userId, productId } },
    });
    return { wishlisted: false };
  }

  await prisma.wishlistItem.create({
    data: { tenantId: tenant.id, userId, productId },
  });
  return { wishlisted: true };
}
