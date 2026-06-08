"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import DOMPurify from "isomorphic-dompurify";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify, toMinorUnits } from "@/lib/utils";

/** Shared field shape parsed from the product form. */
interface ProductInput {
  name: string;
  slug: string;
  description: string | null;
  price: number;
  categoryId: string | null;
  images: string[];
  emoji: string | null;
  badge: string | null;
  stock: number;
}

/** Parse the common product fields out of submitted form data. */
function parseProductForm(formData: FormData): ProductInput {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const categoryRaw = String(formData.get("categoryId") ?? "none");
  const imagesRaw = String(formData.get("images") ?? "");
  const emoji = String(formData.get("emoji") ?? "").trim();
  const badge = String(formData.get("badge") ?? "").trim();
  const stockRaw = String(formData.get("stock") ?? "").trim();

  const images = imagesRaw
    .split(/[\n,]/)
    .map((url) => url.trim())
    .filter((url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    });

  const parsedStock = Number.parseInt(stockRaw, 10);

  return {
    name: DOMPurify.sanitize(name),
    slug: slugify(name),
    description: description ? DOMPurify.sanitize(description) : null,
    price: toMinorUnits(Number.parseFloat(priceRaw) || 0),
    categoryId: categoryRaw === "none" ? null : categoryRaw,
    images,
    emoji: emoji ? DOMPurify.sanitize(emoji) : null,
    badge: badge ? DOMPurify.sanitize(badge) : null,
    stock: Number.isFinite(parsedStock) ? parsedStock : 999,
  };
}

/** Validate that a categoryId belongs to the current tenant. */
async function validateCategoryOwnership(
  categoryId: string | null,
  tenantId: string,
): Promise<void> {
  if (!categoryId) return;
  const category = await prisma.category.findFirst({
    where: { id: categoryId, tenantId },
    select: { id: true },
  });
  if (!category) {
    throw new Error("Invalid category selected.");
  }
}

/** Create a new product scoped to the current tenant. */
export async function createProduct(formData: FormData): Promise<void> {
  const { tenantId } = await getAdminContext();
  const input = parseProductForm(formData);
  await validateCategoryOwnership(input.categoryId, tenantId);

  try {
    await prisma.product.create({
      data: { tenantId, ...input },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("A product with this name already exists.");
    }
    throw error;
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

/** Update an existing product, guaranteeing it belongs to the current tenant. */
export async function updateProduct(formData: FormData): Promise<void> {
  const { tenantId } = await getAdminContext();
  const id = String(formData.get("id") ?? "");
  const input = parseProductForm(formData);
  await validateCategoryOwnership(input.categoryId, tenantId);

  try {
    await prisma.product.updateMany({
      where: { id, tenantId },
      data: input,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("A product with this name already exists.");
    }
    throw error;
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

/** Soft-delete a product (tenant-scoped). */
export async function deleteProduct(formData: FormData): Promise<void> {
  const { tenantId } = await getAdminContext();
  const id = String(formData.get("id") ?? "");

  await prisma.product.updateMany({
    where: { id, tenantId },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/admin/products");
}

/** Restore a soft-deleted product (tenant-scoped). */
export async function restoreProduct(formData: FormData): Promise<void> {
  const { tenantId } = await getAdminContext();
  const id = String(formData.get("id") ?? "");

  await prisma.product.updateMany({
    where: { id, tenantId },
    data: { deletedAt: null },
  });

  revalidatePath("/admin/products");
}
