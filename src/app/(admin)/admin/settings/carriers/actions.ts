"use server";

import { revalidatePath } from "next/cache";
import type { CarrierType } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";

const VALID_CARRIERS: CarrierType[] = ["YAMATO", "SAGAWA", "JAPAN_POST"];

export async function updateCarrierConfig(formData: FormData): Promise<void> {
  const { tenantId } = await getAdminContext();
  const carrier         = String(formData.get("carrier") ?? "") as CarrierType;
  const apiKey          = String(formData.get("apiKey") ?? "").trim() || null;
  const originPostalCode = String(formData.get("originPostalCode") ?? "").trim() || null;
  const enabled         = formData.get("enabled") === "on";

  if (!VALID_CARRIERS.includes(carrier)) throw new Error("Invalid carrier.");

  await prisma.tenantCarrier.upsert({
    where: { tenantId_carrier: { tenantId, carrier } },
    create: { tenantId, carrier, apiKey, originPostalCode, enabled },
    update: { apiKey, originPostalCode, enabled },
  });

  revalidatePath("/admin/settings/carriers");
}
