"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertValidTheme, resolveTheme, isHexColor, DEFAULT_THEME } from "@/lib/theme";

const VALID_CURRENCIES = new Set(["gbp", "jpy", "usd", "eur", "xof"]);

export async function updateTenantSettings(formData: FormData): Promise<void> {
  const { tenantId } = await getAdminContext();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Store name is required.");
  }

  // Fetch existing theme so we can fill missing fields with current values
  const existing = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { theme: true, currency: true },
  });
  const existingTheme = resolveTheme(existing?.theme);

  const primaryRaw = String(formData.get("primary") ?? "").trim();
  const primary = isHexColor(primaryRaw) ? primaryRaw : existingTheme.primary;
  const secondary = existingTheme.secondary || DEFAULT_THEME.secondary;
  const font = existingTheme.font || DEFAULT_THEME.font;
  const logoUrl = String(formData.get("logoUrl") ?? "").trim() || existingTheme.logoUrl || "";

  const theme = assertValidTheme({ primary, secondary, font, logoUrl: logoUrl || undefined });

  // Currency: validate and update if provided
  const currencyRaw = String(formData.get("currency") ?? "").trim().toLowerCase();
  const currency = VALID_CURRENCIES.has(currencyRaw) ? currencyRaw : (existing?.currency ?? "gbp");

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name,
        currency,
        theme: theme as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    console.error("Failed to update tenant settings:", error);
    throw new Error("Could not save settings. Please try again.");
  }

  revalidatePath("/admin/settings");
}
