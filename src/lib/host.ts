/**
 * Pure host-parsing helpers for tenant resolution.
 *
 * Deliberately free of `server-only` / Prisma / `next/headers` so it can be
 * unit-tested in isolation (see `__tests__/tenancy/`). `lib/tenant.ts` composes
 * these with the DB lookups.
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

/** Drop the `:port` suffix and lower-case the host for stable matching. */
export function normalizeHost(host: string): string {
  return host.split(":")[0].trim().toLowerCase();
}

/** Strip a single leading `www.` label. */
export function stripWww(hostname: string): string {
  return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
}

/** The normalized root host the app is served from (port + www stripped). */
export function rootHostname(): string {
  return stripWww(normalizeHost(ROOT_DOMAIN));
}

/**
 * Extract a candidate subdomain slug from a host, or null for the apex/root.
 * Normalization applied: port stripped, `www.` stripped, lower-cased.
 */
export function subdomainFromHost(host: string): string | null {
  const hostname = stripWww(normalizeHost(host));
  const root = rootHostname();

  // Plain "localhost" / apex domain -> no subdomain (root fallback applies).
  if (hostname === root) return null;

  // e.g. "jazyshouse.localhost" with root "localhost" -> "jazyshouse".
  // Require a single remaining label so "a.b.localhost" fails cleanly (null)
  // rather than querying for an unmatchable multi-label slug.
  if (hostname.endsWith(`.${root}`)) {
    const label = hostname.slice(0, -(root.length + 1));
    return label.length > 0 && !label.includes(".") ? label : null;
  }

  // NOTE: a 2-label custom domain (e.g. "jazyshouse.com") yields no subdomain
  // slug — such tenants MUST have their `domain` column populated to resolve.

  // Fallback: treat the leading label as a subdomain for unknown 3+ label hosts.
  const labels = hostname.split(".");
  if (labels.length > 2) return labels[0];

  return null;
}
