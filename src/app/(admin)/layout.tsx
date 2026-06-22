import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MessageSide } from "@prisma/client";
import { SessionProvider } from "@/components/providers/session-provider";
import { AdminShell } from "@/components/admin/admin-shell";
import { resolveTheme } from "@/lib/theme";

// Admin surfaces are per-request and auth-gated — never statically prerendered.
export const dynamic = "force-dynamic";

/**
 * Admin layout shell. `requireAdmin()` is the single auth guard for every route
 * in the (admin) group: unauthenticated / non-admin visitors are redirected to
 * /login before any child renders.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdmin();
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  // Super admins can target any store; tenant admins only ever see their own.
  const tenants = isSuperAdmin
    ? await prisma.tenant.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : session.user.tenantId
      ? await prisma.tenant.findMany({
          where: { id: session.user.tenantId },
          select: { id: true, name: true },
        })
      : [];

  const activeTenantId = isSuperAdmin
    ? session.activeTenantId
    : session.user.tenantId;
  const activeTenantName =
    tenants.find((t) => t.id === activeTenantId)?.name ?? null;

  // Resolve the active store's logo for the admin shell header.
  const activeTenant = activeTenantId
    ? await prisma.tenant.findUnique({
        where: { id: activeTenantId },
        select: { theme: true },
      })
    : null;
  const activeTenantLogoUrl = resolveTheme(activeTenant?.theme).logoUrl;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [pendingOrders, unreadMessages] = activeTenantId
    ? await Promise.all([
        prisma.order.count({
          where: { tenantId: activeTenantId, status: "PENDING" },
        }),
        prisma.orderMessage.count({
          where: {
            tenantId: activeTenantId,
            side: MessageSide.CUSTOMER,
            createdAt: { gte: sevenDaysAgo },
          },
        }),
      ])
    : [0, 0];

  return (
    <SessionProvider session={session}>
      <AdminShell
        user={{
          name: session.user.name ?? null,
          email: session.user.email ?? "",
          role: session.user.role,
        }}
        tenants={tenants}
        activeTenantId={activeTenantId}
        activeTenantName={activeTenantName}
        activeTenantLogoUrl={activeTenantLogoUrl}
        isSuperAdmin={isSuperAdmin}
        badgeCounts={{ pendingOrders, unreadMessages }}
      >
        {children}
      </AdminShell>
    </SessionProvider>
  );
}
