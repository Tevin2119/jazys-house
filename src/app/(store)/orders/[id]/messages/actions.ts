"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";

/**
 * Send a customer-side message on an order thread.
 * The first three args are bound server-side so the client form only submits
 * `content`. We still re-verify tenant + order ownership before writing.
 */
export async function sendCustomerMessage(
  orderId: string,
  tenantId: string,
  senderName: string,
  formData: FormData,
): Promise<void> {
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  // Verify the order exists and belongs to the expected tenant.
  const tenant = await getCurrentTenant();
  if (!tenant || tenant.id !== tenantId) return;

  const exists = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    select: { id: true },
  });
  if (!exists) return;

  await prisma.orderMessage.create({
    data: {
      orderId,
      tenantId,
      content,
      side: "CUSTOMER",
      senderName,
      isInternal: false,
    },
  });

  revalidatePath(`/orders/${orderId}/messages`);
}
