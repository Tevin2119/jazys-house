"use server";

import { revalidatePath } from "next/cache";
import type { RefundStage } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";

const STAGE_ORDER: RefundStage[] = ["REQUESTED", "APPROVED", "PROCESSING", "COMPLETED"];

function nextStage(current: RefundStage): RefundStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  return idx >= 0 && idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}

export async function advanceRefundStage(formData: FormData): Promise<void> {
  const { tenantId } = await getAdminContext();
  const refundId = String(formData.get("refundId") ?? "").trim();

  const refund = await prisma.refund.findFirst({
    where: { id: refundId, tenantId },
    select: { id: true, stage: true, orderId: true },
  });
  if (!refund) throw new Error("Refund not found.");

  const next = nextStage(refund.stage);
  if (!next) throw new Error("Refund is already in the final stage.");

  await prisma.$transaction(async (tx) => {
    await tx.refund.update({
      where: { id: refundId },
      data:  { stage: next },
    });

    // Auto-set order to REFUNDED when refund completes
    if (next === "COMPLETED") {
      await tx.order.updateMany({
        where: { id: refund.orderId, tenantId },
        data:  { status: "REFUNDED" },
      });
    }
  });

  revalidatePath("/admin/refunds");
  revalidatePath(`/admin/orders/${refund.orderId}`);
}
