import "server-only";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import type { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * Auth helpers — the surface admin pages and server actions depend on.
 * The NextAuth instance itself lives in `@/auth`; this module wraps it with the
 * guards and the tenant-scoping context used throughout the admin app.
 */

export type { Session };

/** Roles permitted into the admin app. */
export function isAdminRole(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "TENANT_ADMIN" || role === "OWNER" || role === "ADMIN";
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
  if (!session) {
    redirectToLogin();
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true, authVersion: true, role: true, memberships: { select: { role: true } } },
  });
  const hasAdminMembership = user?.memberships.some((membership) => isAdminRole(membership.role));
  if (!user || !user.isActive || user.authVersion !== session.user.authVersion || (!isAdminRole(user.role) && !hasAdminMembership)) {
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
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isActive: true, authVersion: true },
  });
  if (!user || !user.isActive || user.authVersion !== session.user.authVersion || user.role !== "SUPER_ADMIN") {
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
  /** Live role for this tenant, resolved from membership where present. */
  role: UserRole;
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
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { role: true, tenantId: true, memberships: { select: { tenantId: true, role: true, permissions: true } } },
  });
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const membership = !isSuperAdmin
    ? user.memberships.find((item) => item.tenantId === session.activeTenantId) ?? user.memberships[0]
    : undefined;
  const tenantId = isSuperAdmin ? session.activeTenantId : membership?.tenantId ?? user.tenantId;

  if (!tenantId) {
    redirect("/admin/select-tenant");
  }

  const role = isSuperAdmin ? "SUPER_ADMIN" : membership?.role ?? user.role;
  if (!isAdminRole(role)) redirectToLogin();
  return { session, tenantId, isSuperAdmin, role };
}
