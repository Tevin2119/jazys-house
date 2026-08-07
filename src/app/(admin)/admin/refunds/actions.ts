"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function advanceRefundStage(formData: FormData): Promise<void> {
  const { tenantId, role } = await getAdminContext();
  if (role !== "SUPER_ADMIN" && role !== "OWNER" && role !== "TENANT_ADMIN") {
    throw new Error("Only store owners may approve refunds.");
  }
  const refundId = String(formData.get("refundId") ?? "").trim();
  const refund = await prisma.refund.findFirst({
    where: { id: refundId, tenantId },
    include: { order: { select: { id: true, tenantId: true, total: true, currency: true, paymentStatus: true, stripePaymentIntentId: true } } },
  });
  if (!refund) throw new Error("Refund not found.");

  if (refund.stage === "REQUESTED") {
    await prisma.refund.update({ where: { id: refund.id }, data: { stage: "APPROVED" } });
  } else if (refund.stage === "APPROVED") {
    if (refund.amount < 1 || refund.order.paymentStatus !== "COMPLETED" || !refund.order.stripePaymentIntentId) {
      throw new Error("This refund is not eligible for Stripe processing.");
    }
    const aggregate = await prisma.refund.aggregate({
      where: { orderId: refund.orderId, tenantId, stage: { in: ["APPROVED", "PROCESSING", "COMPLETED"] }, id: { not: refund.id } },
      _sum: { amount: true },
    });
    if ((aggregate._sum.amount ?? 0) + refund.amount > refund.order.total) {
      throw new Error("Refund amount exceeds the paid order total.");
    }
    const providerRefund = await stripe.refunds.create({
      payment_intent: refund.order.stripePaymentIntentId,
      amount: refund.amount,
      metadata: { refundId: refund.id, orderId: refund.orderId, tenantId },
    }, { idempotencyKey: `refund:${refund.id}` });
    await prisma.refund.update({
      where: { id: refund.id },
      data: { stage: providerRefund.status === "succeeded" ? "COMPLETED" : "PROCESSING", providerRefundId: providerRefund.id, providerPaymentId: refund.order.stripePaymentIntentId, failureReason: providerRefund.failure_reason ?? null },
    });
  } else {
    throw new Error("This refund is awaiting Stripe confirmation or is already complete.");
  }

  revalidatePath("/admin/refunds");
  revalidatePath(`/admin/orders/${refund.orderId}`);
}
