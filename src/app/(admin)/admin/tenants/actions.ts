"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertValidTheme } from "@/lib/theme";
import { DEFAULT_CATEGORIES } from "@/lib/tenant-defaults";
import { isSupportedCurrency, slugify } from "@/lib/utils";

export interface TenantActionState {
  error?: string;
}

function parseCurrency(raw: FormDataEntryValue | null): string {
  const c = String(raw ?? "").trim().toLowerCase() || "gbp";
  if (!isSupportedCurrency(c)) {
    throw new Error("Currency must be one of GBP, JPY, USD, EUR, or XOF.");
  }
  return c;
}

function parseDomain(raw: FormDataEntryValue | null): string | null {
  const d = String(raw ?? "").trim().toLowerCase();
  return d ? d.replace(/^https?:\/\//, "").replace(/\/.*$/, "") : null;
}

function isP2002(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/**
 * Create a tenant (SUPER_ADMIN only): the tenant row, its default categories,
 * and a first TENANT_ADMIN owner — all in one transaction so a partial store is
 * never left behind. Returns `{ error }` for the form to display; redirects to
 * the tenant list on success.
 */
export async function createTenant(
  _prev: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  await requireSuperAdmin();

  try {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { error: "Store name is required." };

    const slug = slugify(String(formData.get("slug") || name));
    if (!slug) return { error: "A valid slug could not be derived." };

    const domain = parseDomain(formData.get("domain"));
    const currency = parseCurrency(formData.get("currency"));
    const theme = assertValidTheme({
      primary: formData.get("primary"),
      secondary: formData.get("secondary"),
      font: formData.get("font"),
      logoUrl: formData.get("logoUrl"),
    });

    const adminEmail = String(formData.get("adminEmail") ?? "")
      .trim()
      .toLowerCase();
    const adminPassword = String(formData.get("adminPassword") ?? "");
    if (!adminEmail || !adminEmail.includes("@")) {
      return { error: "A valid owner email is required." };
    }
    if (adminPassword.length < 16) {
      return { error: "Owner password must be at least 16 characters." };
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name, slug, domain, currency, theme: theme as unknown as Prisma.InputJsonValue },
      });

      await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((c) => ({
          tenantId: tenant.id,
          slug: c.slug,
          name: c.name,
        })),
      });

      const owner = await tx.user.create({
        data: {
          email: adminEmail,
          name: `${name} Owner`,
          role: "TENANT_ADMIN",
          tenantId: tenant.id,
          passwordHash,
        },
      });
      await tx.tenantMembership.create({ data: { userId: owner.id, tenantId: tenant.id, role: "OWNER" } });
    });
  } catch (error) {
    if (isP2002(error)) {
      const target = (error.meta?.target as string[] | undefined)?.join(", ") ?? "";
      if (target.includes("email")) return { error: "That owner email is already in use." };
      if (target.includes("domain")) return { error: "That domain is already taken." };
      return { error: "That slug is already taken." };
    }
    console.error("createTenant failed:", error);
    return { error: error instanceof Error ? error.message : "Could not create the store." };
  }

  revalidatePath("/admin/tenants");
  redirect("/admin/tenants");
}

/**
 * Update an existing tenant's name, domain, currency, and branding. The slug is
 * immutable (storefront URLs depend on it). SUPER_ADMIN only.
 */
export async function updateTenant(
  _prev: TenantActionState,
  formData: FormData,
): Promise<TenantActionState> {
  await requireSuperAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing tenant id." };

  try {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { error: "Store name is required." };

    const domain = parseDomain(formData.get("domain"));
    const currency = parseCurrency(formData.get("currency"));
    const theme = assertValidTheme({
      primary: formData.get("primary"),
      secondary: formData.get("secondary"),
      font: formData.get("font"),
      logoUrl: formData.get("logoUrl"),
    });

    const existing = await prisma.tenant.findUniqueOrThrow({ where: { id }, select: { currency: true } });
    if (currency !== existing.currency) {
      const records = await prisma.product.count({ where: { tenantId: id } }) + await prisma.order.count({ where: { tenantId: id } });
      if (records > 0) return { error: "Currency cannot change after products or orders exist." };
    }
    await prisma.tenant.update({
      where: { id },
      data: { name, domain, currency, theme: theme as unknown as Prisma.InputJsonValue },
    });
  } catch (error) {
    if (isP2002(error)) return { error: "That domain is already taken." };
    console.error("updateTenant failed:", error);
    return { error: error instanceof Error ? error.message : "Could not save the store." };
  }

  revalidatePath("/admin/tenants");
  revalidatePath("/admin/settings");
  redirect("/admin/tenants");
}

/**
 * Delete a tenant (SUPER_ADMIN only). BLOCKED if any orders exist — orders are
 * financial records and the Order→Tenant FK is intentionally `Restrict`. For an
 * order-free tenant, users are removed explicitly and the tenant delete cascades
 * categories / products / catering / newsletter rows.
 */
export async function deleteTenant(formData: FormData): Promise<void> {
  await requireSuperAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/tenants");

  const orderCount = await prisma.order.count({ where: { tenantId: id } });
  if (orderCount > 0) {
    redirect("/admin/tenants?error=orders");
  }

  try {
    await prisma.$transaction([
      prisma.user.deleteMany({ where: { tenantId: id } }),
      prisma.tenant.delete({ where: { id } }),
    ]);
  } catch (error) {
    // P2003 = an Order/OrderItem was created in the window after our count, so
    // the Restrict FK blocked the delete. Treat it as the orders-block case.
    // P2025 = the tenant is already gone. Anything else → generic delete error.
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") redirect("/admin/tenants?error=orders");
      if (error.code === "P2025") redirect("/admin/tenants");
    }
    console.error("deleteTenant failed:", error);
    redirect("/admin/tenants?error=delete");
  }

  revalidatePath("/admin/tenants");
  redirect("/admin/tenants");
}
