"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertValidTheme } from "@/lib/theme";

/**
 * Update the current tenant's store name and branding theme.
 *
 * The tenant scope is re-derived from the session — the form never supplies a
 * tenantId, and we update by `id: tenantId` so a tenant can only ever modify
 * its own record.
 */
export async function updateTenantSettings(formData: FormData): Promise<void> {
  const { tenantId } = await getAdminContext();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Store name is required.");
  }

  // Validate operator-supplied branding (M7): hex colors, allowlisted font,
  // safe logo reference. Throws a user-facing error on the first bad field.
  const theme = assertValidTheme({
    primary: formData.get("primary"),
    secondary: formData.get("secondary"),
    font: formData.get("font"),
    logoUrl: formData.get("logoUrl"),
  });

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { name, theme: theme as unknown as Prisma.InputJsonValue },
    });
  } catch (error) {
    console.error("Failed to update tenant settings:", error);
    throw new Error("Could not save settings. Please try again.");
  }

  revalidatePath("/admin/settings");
}
