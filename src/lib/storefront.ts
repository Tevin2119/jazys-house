import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Storefront data access — every query is scoped by `tenantId` and excludes
 * soft-deleted products (`deletedAt: null`). Callers pass the tenantId resolved
 * from the request host via `getCurrentTenant()`; we NEVER trust a tenant or
 * category id supplied by the client/URL.
 */

const LIVE_PRODUCT = { deletedAt: null } satisfies Prisma.ProductWhereInput;

export type StoreProduct = Prisma.ProductGetPayload<{
  include: { category: true };
}>;

/** All categories for a tenant, alphabetical. */
export function getCategories(tenantId: string) {
  return prisma.category.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });
}

/** Featured products = those with a badge set (bestsellers, new, etc.). */
export function getFeaturedProducts(tenantId: string, take = 6) {
  return prisma.product.findMany({
    where: { tenantId, ...LIVE_PRODUCT, badge: { not: null } },
    orderBy: { createdAt: "asc" },
    take,
  });
}

/**
 * Catalog grid with optional category + search filters.
 *
 * COUNCIL FIX C1: the category is resolved by *slug within this tenant* — a
 * client-supplied slug can only ever match this tenant's own categories, so a
 * crafted value cannot leak another store's products.
 */
export async function getCatalog(opts: {
  tenantId: string;
  categorySlug?: string;
  q?: string;
}): Promise<StoreProduct[]> {
  const { tenantId, categorySlug, q } = opts;

  const where: Prisma.ProductWhereInput = { tenantId, ...LIVE_PRODUCT };

  if (categorySlug && categorySlug !== "all") {
    const category = await prisma.category.findUnique({
      where: { tenantId_slug: { tenantId, slug: categorySlug } },
      select: { id: true },
    });
    // Unknown slug for this tenant → no products (rather than leaking all).
    if (!category) return [];
    where.categoryId = category.id;
  }

  if (q && q.trim()) {
    where.name = { contains: q.trim(), mode: "insensitive" };
  }

  return prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });
}

/** A single live product by slug within the tenant (with its category). */
export function getProductBySlug(tenantId: string, slug: string) {
  return prisma.product.findFirst({
    where: { tenantId, slug, ...LIVE_PRODUCT },
    include: { category: true },
  });
}

/**
 * Related products in the same category, excluding the current product.
 *
 * `categoryId` MUST come from a product already fetched with tenant scoping
 * (e.g. `getProductBySlug`) — never directly from URL/client input. The query is
 * still tenant-fenced, so a mismatched id simply returns nothing.
 */
export function getRelatedProducts(
  tenantId: string,
  categoryId: string,
  excludeId: string,
  take = 4,
) {
  return prisma.product.findMany({
    where: {
      tenantId,
      ...LIVE_PRODUCT,
      categoryId,
      id: { not: excludeId },
    },
    take,
    orderBy: { createdAt: "asc" },
  });
}
