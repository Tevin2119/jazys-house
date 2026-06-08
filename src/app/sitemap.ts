import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/**
 * Dynamic sitemap — tenant-scoped. Resolves the current store from the request
 * host, then lists static pages plus every live product. URLs are built from the
 * incoming host so each tenant's sitemap reflects its own domain/subdomain.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headerList = await headers();
  const host =
    headerList.get("x-tenant-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto =
    headerList.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  const base = `${proto}://${host}`;

  const staticRoutes = ["", "/shop", "/catering", "/about"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const tenant = await getCurrentTenant();
  if (!tenant) return staticRoutes;

  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id, deletedAt: null },
    select: { slug: true, updatedAt: true },
  });

  const productRoutes = products.map((p) => ({
    url: `${base}/shop/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes];
}
