import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * Per-host robots.txt. Like the sitemap, the URL is derived from the incoming
 * request host so each tenant (custom domain / subdomain) advertises its own
 * sitemap. Customer-facing storefront pages are crawlable; admin, auth, API,
 * and checkout routes are not.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerList = await headers();
  const host =
    headerList.get("x-tenant-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto =
    headerList.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  const base = `${proto}://${host}`;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/login", "/checkout"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
