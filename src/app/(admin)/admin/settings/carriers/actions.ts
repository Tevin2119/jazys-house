"use server";

import { revalidatePath } from "next/cache";
import type { CarrierType } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { encryptCredential } from "@/lib/credentials";
import { prisma } from "@/lib/db";

const VALID_CARRIERS: CarrierType[] = ["YAMATO", "SAGAWA", "JAPAN_POST"];

export async function updateCarrierConfig(formData: FormData): Promise<void> {
  const { tenantId, role } = await getAdminContext();
  if (role !== "SUPER_ADMIN" && role !== "OWNER" && role !== "TENANT_ADMIN") {
    throw new Error("Only store owners may manage carrier credentials.");
  }
  const carrier         = String(formData.get("carrier") ?? "") as CarrierType;
  const apiKey          = String(formData.get("apiKey") ?? "").trim();
  const originPostalCode = String(formData.get("originPostalCode") ?? "").trim() || null;
  const enabled         = formData.get("enabled") === "on";

  if (!VALID_CARRIERS.includes(carrier)) throw new Error("Invalid carrier.");

  await prisma.tenantCarrier.upsert({
    where: { tenantId_carrier: { tenantId, carrier } },
    create: { tenantId, carrier, apiKeyEncrypted: apiKey ? encryptCredential(apiKey) : null, originPostalCode, enabled },
    // A blank field preserves the encrypted value. Secrets are never read back.
    update: { ...(apiKey ? { apiKeyEncrypted: encryptCredential(apiKey) } : {}), originPostalCode, enabled },
  });

  revalidatePath("/admin/settings/carriers");
}
