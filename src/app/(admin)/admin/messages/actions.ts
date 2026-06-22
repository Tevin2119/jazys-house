"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function sendMessageFromCenter(formData: FormData): Promise<void> {
  const { tenantId } = await getAdminContext();
  const orderId    = String(formData.get("orderId")    ?? "").trim();
  const content    = String(formData.get("content")    ?? "").trim();
  const isInternal = formData.get("isInternal") === "true";

  if (!orderId || !content) return;

  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    select: { id: true },
  });
  if (!order) throw new Error("Order not found.");

  await prisma.orderMessage.create({
    data: {
      orderId,
      tenantId,
      content,
      side:       "STORE",
      senderName: "Store",
      isInternal,
    },
  });

  revalidatePath("/admin/messages");
  revalidatePath(`/admin/orders/${orderId}`);
}
