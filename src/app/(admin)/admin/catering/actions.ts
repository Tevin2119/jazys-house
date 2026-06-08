"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";

const STATUSES = ["new", "contacted", "booked", "declined"] as const;
type CateringStatus = (typeof STATUSES)[number];

function isValidStatus(value: string): value is CateringStatus {
  return (STATUSES as readonly string[]).includes(value);
}

/** Update the status of a catering inquiry (tenant-scoped). */
export async function updateCateringStatus(formData: FormData): Promise<void> {
  const { tenantId } = await getAdminContext();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!isValidStatus(status)) {
    throw new Error("Invalid catering status.");
  }

  await prisma.cateringInquiry.updateMany({
    where: { id, tenantId },
    data: { status },
  });

  revalidatePath("/admin/catering");
}
