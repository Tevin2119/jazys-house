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
function parseProductForm(formData: FormData, currency = "gbp"): ProductInput {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const categoryRaw = String(formData.get("categoryId") ?? "none");
  const imagesRaw = String(formData.get("images") ?? "");
  const emoji = String(formData.get("emoji") ?? "").trim();
  const badge = String(formData.get("badge") ?? "").trim();
  const stockRaw = String(formData.get("stock") ?? "").trim();

  // COUNCIL FIX (JH-004): restrict image URLs to approved providers only.
  // Arbitrary URLs are an SSRF vector — an admin could supply an internal
  // endpoint (http://169.254.169.254/latest/meta-data/) and the server
  // would fetch it when rendering/optimizing images.
  const ALLOWED_IMAGE_HOSTS = [
    /\.r2\.dev$/,                    // Cloudflare R2 public buckets
    /^pub-[a-f0-9]+\.r2\.dev$/,     // R2 custom domains
    /\.cloudflarestorage\.com$/,     // R2 S3-compatible endpoint
    /\.supabase\.co$/,               // Supabase Storage
    /^res\.cloudinary\.com$/,        // Cloudinary
    /\.blob\.vercel-storage\.com$/,  // Vercel Blob
  ];

  function isAllowedImageUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") return false; // HTTPS only

      // Block private/internal IPs (SSRF protection)
      const BLOCKED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"];
      if (BLOCKED_HOSTS.includes(parsed.hostname)) return false;
      if (parsed.hostname.match(/^10\.|^172\.(1[6-9]|2\d|3[01])\.|^192\.168\./)) return false;
      if (parsed.hostname === "169.254.169.254") return false; // AWS metadata

      // Allowlist check
      return ALLOWED_IMAGE_HOSTS.some((pattern) => pattern.test(parsed.hostname));
    } catch {
      return false;
    }
  }

  const images = imagesRaw
    .split(/[\n,]/)
    .map((url) => url.trim())
    .filter(isAllowedImageUrl);

  const parsedStock = Number.parseInt(stockRaw, 10);

  const parsedPrice = Number.parseFloat(priceRaw);
  if (!name || name.length > 160 || !Number.isFinite(parsedPrice) || parsedPrice < 0 || parsedPrice > 20_000_000) {
    throw new Error("Enter a valid product name and non-negative price.");
  }
  if (!Number.isInteger(parsedStock) || parsedStock < 0 || parsedStock > 10_000_000) {
    throw new Error("Enter a valid non-negative stock quantity.");
  }

  return {
    name: DOMPurify.sanitize(name),
    slug: slugify(name),
    description: description ? DOMPurify.sanitize(description) : null,
    price: toMinorUnits(parsedPrice, currency),
    categoryId: categoryRaw === "none" ? null : categoryRaw,
    images,
    emoji: emoji ? DOMPurify.sanitize(emoji) : null,
    badge: badge ? DOMPurify.sanitize(badge) : null,
    stock: parsedStock,
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
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { currency: true },
  });
  const input = parseProductForm(formData, tenant?.currency ?? "gbp");
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
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { currency: true },
  });
  const input = parseProductForm(formData, tenant?.currency ?? "gbp");
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
