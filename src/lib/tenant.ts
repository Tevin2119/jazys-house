import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import type { Tenant } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeHost, stripWww, subdomainFromHost } from "@/lib/host";

// Re-export the pure host helpers so existing importers keep working.
export { subdomainFromHost } from "@/lib/host";

/**
 * Tenant resolution — LAYOUT-BASED (NOT edge middleware).
 *
 * COUNCIL FIX: the Edge runtime cannot run Prisma, so we do NOT resolve tenants
 * in middleware. `middleware.ts` only extracts the request host into the
 * `x-tenant-host` header (and, for path-based dev routing, a `x-tenant-slug`
 * header); the actual DB lookup happens here in Node-runtime Server Components.
 *
 * Resolution precedence (first match wins):
 *   1. Explicit slug   — `x-tenant-slug` from a `/store/<slug>` path (dev/testing)
 *   2. Custom domain   — `tenant.domain === host`            (jazyshouse.com)
 *   3. Subdomain slug  — first label of host                 (jazyshouse.localhost:3000)
 *   4. Root fallback   — apex/root host → the default tenant (localhost:3000)
 *
 * Normalization applied throughout: port stripped, `www.` stripped, slugs
 * lower-cased (slugs are stored lower-case and matched case-insensitively).
 */

const DEFAULT_TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG ?? null;

/**
 * Look up a tenant by host (custom domain first, then subdomain slug).
 * Memoized per-request via React `cache` so multiple layouts/pages in one
 * render share a single query.
 */
export const getTenantByHost = cache(
  async (host: string): Promise<Tenant | null> => {
    const hostname = stripWww(normalizeHost(host));
    const slug = subdomainFromHost(host);

    return prisma.tenant.findFirst({
      where: {
        OR: [
          { domain: hostname },
          ...(slug ? [{ slug: slug.toLowerCase() }] : []),
        ],
      },
    });
  },
);

/** Look up a tenant by its explicit slug (path-based routing, e.g. /store/jazyshouse). */
export const getTenantBySlug = cache(
  async (slug: string): Promise<Tenant | null> => {
    return prisma.tenant.findUnique({ where: { slug: slug.trim().toLowerCase() } });
  },
);

/**
 * The fallback tenant for the bare root domain (e.g. `localhost:3000`).
 * Prefers `DEFAULT_TENANT_SLUG`; otherwise the oldest tenant (lowest createdAt).
 * Returns null only on an empty database.
 */
export const getDefaultTenant = cache(async (): Promise<Tenant | null> => {
  if (DEFAULT_TENANT_SLUG) {
    const bySlug = await prisma.tenant.findUnique({
      where: { slug: DEFAULT_TENANT_SLUG.toLowerCase() },
    });
    if (bySlug) return bySlug;
  }
  return prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } });
});

/**
 * Resolve the tenant for the CURRENT request. Returns null when the host names
 * a store that does not exist (caller renders NoStore / 404). The root domain,
 * however, resolves to the default tenant rather than null.
 */
export const getCurrentTenant = cache(async (): Promise<Tenant | null> => {
  const headerList = await headers();

  // 1. Explicit slug from a `/store/<slug>` path (dev/testing affordance).
  const slugHeader = headerList.get("x-tenant-slug");
  if (slugHeader) {
    return getTenantBySlug(slugHeader);
  }

  const host =
    headerList.get("x-tenant-host") ?? headerList.get("host") ?? "";
  if (!host) return null;

  // 2 + 3. Custom domain / subdomain slug.
  const byHost = await getTenantByHost(host);
  if (byHost) return byHost;

  // 4. Root/apex host with no matching store → default tenant. An *unknown*
  //    subdomain (e.g. nope.localhost) deliberately does NOT fall back — it must
  //    404 rather than silently leak the default store.
  if (subdomainFromHost(host) === null) {
    return getDefaultTenant();
  }
  return null;
});
