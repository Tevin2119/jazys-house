"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ORDER_STATUSES, allowedNextStatuses } from "@/lib/order-status";

/** Type guard: is an arbitrary string a real OrderStatus enum value? */
function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as string[]).includes(value);
}

/**
 * Advance an order's status, enforcing the legal transition graph.
 * Tenant scope is re-derived server-side — never trusted from form input.
 */
export async function updateOrderStatus(formData: FormData): Promise<void> {
  const { tenantId, session } = await getAdminContext();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  const order = await prisma.order.findFirst({
    where: { id, tenantId },
    select: { status: true, paymentStatus: true },
  });
  if (!order) throw new Error("Order not found.");

  if (!isOrderStatus(status) || !allowedNextStatuses(order.status).includes(status)) {
    throw new Error("Illegal status transition.");
  }

  // Stripe-state gate (Phase 4d): an unpaid order may only be CANCELLED, never
  // advanced into fulfilment. Payment confirmation arrives via the Stripe webhook
  // (PENDING → PROCESSING); admins cannot hand-promote an unpaid order.
  const isPaid = order.paymentStatus === "COMPLETED";
  if (order.status === "PENDING" && status === "PROCESSING" && !isPaid) {
    throw new Error("Payment not yet confirmed — cannot start fulfilment.");
  }

  // COUNCIL H1 (order status race): compare-and-swap. The `status: order.status`
  // guard makes the transition atomic — if another admin (or the Stripe webhook)
  // changed the status between our read and this write, `count` is 0 and we
  // surface a conflict instead of silently clobbering their change.
  const res = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({ where: { id, tenantId, status: order.status }, data: { status } });
    if (updated.count === 1) {
      await tx.orderStatusLog.create({ data: { orderId: id, tenantId, oldStatus: order.status, newStatus: status, changedBy: session.user.id, reason: "Admin status update" } });
    }
    return updated;
  });

  if (res.count !== 1) {
    throw new Error(
      "This order's status changed in another session. Refresh and try again.",
    );
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}
