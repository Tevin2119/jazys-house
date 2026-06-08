"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

/** Create a category scoped to the current tenant. */
export async function createCategory(formData: FormData): Promise<void> {
  const { tenantId } = await getAdminContext();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");

  try {
    await prisma.category.create({
      data: { tenantId, name, slug: slugify(name) },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("A category with this name already exists.");
    }
    throw error;
  }

  revalidatePath("/admin/categories");
}

/** Rename a category, guaranteeing it belongs to the current tenant. */
export async function updateCategory(formData: FormData): Promise<void> {
  const { tenantId } = await getAdminContext();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");

  try {
    await prisma.category.updateMany({
      where: { id, tenantId },
      data: { name, slug: slugify(name) },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("A category with this name already exists.");
    }
    throw error;
  }

  revalidatePath("/admin/categories");
}

/** Delete a category — only permitted when it has no products. */
export async function deleteCategory(formData: FormData): Promise<void> {
  const { tenantId } = await getAdminContext();
  const id = String(formData.get("id") ?? "");

  const productCount = await prisma.product.count({
    where: { tenantId, categoryId: id },
  });
  if (productCount > 0) {
    throw new Error("Cannot delete a category that still has products.");
  }

  await prisma.category.deleteMany({
    where: { id, tenantId },
  });

  revalidatePath("/admin/categories");
}
