import "server-only";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import type { UserRole } from "@prisma/client";
import { auth } from "@/auth";

/**
 * Auth helpers — the surface admin pages and server actions depend on.
 * The NextAuth instance itself lives in `@/auth`; this module wraps it with the
 * guards and the tenant-scoping context used throughout the admin app.
 */

export type { Session };

/** Roles permitted into the admin app. */
export function isAdminRole(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "TENANT_ADMIN";
}

/** Current session, or null if unauthenticated. */
export async function getSession(): Promise<Session | null> {
  return auth();
}

/** Redirect unauthenticated visitors to the login page. */
export function redirectToLogin(): never {
  redirect("/login");
}

/**
 * Guard for admin routes/actions. Redirects to /login when there is no admin
 * session. Returns the session for authorized admins.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session || !isAdminRole(session.user.role)) {
    redirectToLogin();
  }
  return session;
}

/**
 * Guard for super-admin-only routes/actions. Runs the admin guard first, then
 * redirects any non-super-admin to the dashboard BEFORE the caller touches data —
 * so a tenant admin can never reach a cross-tenant query.
 */
export async function requireSuperAdmin(): Promise<Session> {
  const session = await requireAdmin();
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }
  return session;
}

/** True if the user may operate on the given tenant's data. */
export function canAccessTenant(
  user: Session["user"],
  tenantId: string,
): boolean {
  if (user.role === "SUPER_ADMIN") return true;
  return user.role === "TENANT_ADMIN" && user.tenantId === tenantId;
}

export interface AdminContext {
  session: Session;
  /**
   * The single tenant id every query in this request MUST be scoped to.
   * - TENANT_ADMIN → their own tenant (active switch is ignored for them).
   * - SUPER_ADMIN  → the tenant they have selected in the switcher.
   */
  tenantId: string;
  isSuperAdmin: boolean;
}

/**
 * The authoritative tenant scope for the current admin request.
 *
 * SECURITY: a TENANT_ADMIN is always pinned to `user.tenantId` regardless of any
 * `activeTenantId` claim — they can never read or write another tenant's data.
 * A SUPER_ADMIN uses their selected `activeTenantId`; if none is resolvable
 * (e.g. a brand-new database with zero tenants) they are sent to the tenant
 * chooser instead of leaking a cross-tenant default.
 */
export async function getAdminContext(): Promise<AdminContext> {
  const session = await requireAdmin();
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  const tenantId = isSuperAdmin
    ? session.activeTenantId
    : session.user.tenantId;

  if (!tenantId) {
    redirect("/admin/select-tenant");
  }

  return { session, tenantId, isSuperAdmin };
}
