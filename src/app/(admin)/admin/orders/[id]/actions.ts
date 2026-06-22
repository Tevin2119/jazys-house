"use server";

import { revalidatePath } from "next/cache";
import type { CarrierType } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";

const VALID_CARRIERS: CarrierType[] = ["YAMATO", "SAGAWA", "JAPAN_POST", "OTHER"];

export async function sendOrderMessage(formData: FormData): Promise<void> {
  const { tenantId } = await getAdminContext();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
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
      side: "STORE",
      senderName: "Store",
      isInternal,
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/messages");
}

export async function createShipment(formData: FormData): Promise<void> {
  const { tenantId } = await getAdminContext();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const carrier = String(formData.get("carrier") ?? "") as CarrierType;
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim() || null;

  if (!orderId || !VALID_CARRIERS.includes(carrier)) {
    throw new Error("Invalid shipment data.");
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    select: { id: true },
  });
  if (!order) throw new Error("Order not found.");

  await prisma.shipment.create({
    data: {
      orderId,
      tenantId,
      carrier,
      trackingNumber,
      status: "PENDING",
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
}
