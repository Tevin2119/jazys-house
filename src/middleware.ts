import { NextResponse, type NextRequest } from "next/server";

/**
 * Thin middleware — host extraction + path-based tenant routing ONLY.
 *
 * COUNCIL FIX: tenant resolution is LAYOUT-BASED, not edge-based, because the
 * Edge runtime can't run Prisma. This middleware therefore does NOT touch the
 * database. It forwards the incoming hostname to Server Components via the
 * `x-tenant-host` header; `lib/tenant.ts` performs the actual Prisma lookup in
 * the Node runtime.
 *
 * Dev/testing affordance: a `/store/<slug>/…` path is rewritten to `/…` with the
 * slug forwarded in `x-tenant-slug`, so a tenant can be previewed by path
 * without configuring a subdomain or custom domain.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  const requestHeaders = new Headers(request.headers);

  // COUNCIL FIX: strip any client-supplied tenant headers BEFORE setting
  // trusted server-derived values. An attacker sending x-tenant-slug or
  // x-tenant-host can hijack the tenant context if these are blindly trusted.
  requestHeaders.delete("x-tenant-slug");
  requestHeaders.delete("x-tenant-host");

  requestHeaders.set("x-tenant-host", host);

  // Path-based routing: /store/<slug>/rest -> /rest, tenant = <slug>.
  const match = request.nextUrl.pathname.match(/^\/store\/([^/]+)(\/.*)?$/);
  if (match) {
    const [, slug, rest] = match;
    requestHeaders.set("x-tenant-slug", slug);

    const url = request.nextUrl.clone();
    url.pathname = rest && rest.length > 0 ? rest : "/";
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
