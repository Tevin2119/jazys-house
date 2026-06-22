export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";
import { PermissionsGrid } from "@/components/admin/permissions-grid";
import { updateMembershipRole } from "./actions";

const ROLE_LABELS: Partial<Record<UserRole, string>> = {
  OWNER: "Owner", ADMIN: "Admin", EMPLOYEE: "Employee", TENANT_ADMIN: "Admin",
};
const ROLE_COLORS: Partial<Record<UserRole, { bg: string; color: string }>> = {
  OWNER:       { bg: "#fbe5cf", color: "#9a6b1e" },
  ADMIN:       { bg: "#d8e6f5", color: "#2f5d8a" },
  TENANT_ADMIN:{ bg: "#d8e6f5", color: "#2f5d8a" },
  EMPLOYEE:    { bg: "#f0e8da", color: "#6b5d4f" },
};

function initials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (name[0] ?? "?").toUpperCase();
  }
  return (email?.[0] ?? "?").toUpperCase();
}

function avatarColor(str: string): string {
  const COLORS = ["#c0563d", "#2f5d8a", "#5a4a9a", "#2f6b3a", "#9a6b1e", "#6b5d4f"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

const STATUS_ACTION_LABELS: Record<string, string> = {
  PENDING: "Order marked Pending",
  PROCESSING: "Order moved to Processing",
  LABEL_CREATED: "Shipping label created",
  SHIPPED: "Order marked Shipped",
  IN_TRANSIT: "Order In Transit",
  DELIVERED: "Order Delivered",
  CANCELLED: "Order Cancelled",
  REFUNDED: "Order Refunded",
};

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { tenantId } = await getAdminContext();
  const { id } = await params;

  const membership = await prisma.tenantMembership.findFirst({
    where: { id, tenantId },
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
  });
  if (!membership) notFound();

  const activity = await prisma.orderStatusLog.findMany({
    where: { tenantId, changedBy: membership.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { order: { select: { id: true } } },
  });

  const init   = initials(membership.user.name, membership.user.email);
  const bg     = avatarColor(membership.user.id);
  const role   = ROLE_LABELS[membership.role] ?? membership.role;
  const colors = ROLE_COLORS[membership.role] ?? { bg: "#f0e8da", color: "#6b5d4f" };

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: "#a39685", marginBottom: 20 }}>
        <Link href="/admin/employees" style={{ color: "#c0563d", textDecoration: "none" }}>Employees</Link>
        <span style={{ margin: "0 6px" }}>›</span>
        {membership.user.name ?? membership.user.email}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 22, alignItems: "start" }} className="max-lg:flex max-lg:flex-col">
        {/* Left: Profile card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 14, padding: "28px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: bg, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800 }}>
              {init}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#2a1f16" }}>{membership.user.name ?? "—"}</div>
              <div style={{ fontSize: 13, color: "#8a7c6a", marginTop: 2 }}>{membership.user.email}</div>
            </div>
            <span style={{ background: colors.bg, color: colors.color, padding: "4px 16px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>
              {role}
            </span>
            <div style={{ fontSize: 11, color: "#a39685" }}>
              <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#4ade80", marginRight: 4 }} />
              Active · Joined {membership.user.createdAt.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
            </div>
          </div>

          {/* Role selector */}
          <div style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13, padding: "18px 22px" }}>
            <div style={{ fontFamily: "'Marcellus', serif", fontSize: 16, marginBottom: 12 }}>Change Role</div>
            <RoleForm membershipId={id} currentRole={membership.role} />
          </div>
        </div>

        {/* Right: Permissions + Activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Permissions grid */}
          <div style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #ece2d2", fontFamily: "'Marcellus', serif", fontSize: 17 }}>
              Permissions
            </div>
            <div style={{ padding: "20px 22px" }}>
              <PermissionsGrid
                membershipId={id}
                role={membership.role}
                storedPermissions={membership.permissions}
              />
            </div>
          </div>

          {/* Activity log */}
          <div style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #ece2d2", fontFamily: "'Marcellus', serif", fontSize: 17 }}>
              Activity Log
            </div>
            {activity.length === 0 ? (
              <div style={{ padding: "28px 22px", color: "#8a7c6a", fontSize: 14 }}>No recorded activity yet.</div>
            ) : (
              activity.map(log => (
                <div key={log.id} style={{ padding: "12px 22px", borderBottom: "1px solid #f4ecde", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c0563d", marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#2a1f16" }}>
                      {STATUS_ACTION_LABELS[log.newStatus] ?? `Status → ${log.newStatus}`}
                    </div>
                    <div style={{ fontSize: 12, color: "#8a7c6a", marginTop: 2 }}>
                      Order <Link href={`/admin/orders/${log.order.id}`} style={{ color: "#c0563d" }}>#{log.order.id.slice(0, 6)}</Link>
                      {log.reason ? ` · ${log.reason}` : ""}
                      {" · "}{log.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inline role-change form (server action via form) ──

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "OWNER",    label: "Owner"    },
  { value: "ADMIN",    label: "Admin"    },
  { value: "EMPLOYEE", label: "Employee" },
];

function RoleForm({ membershipId, currentRole }: { membershipId: string; currentRole: UserRole }) {
  async function handleSubmit(formData: FormData) {
    "use server";
    const role = formData.get("role") as UserRole;
    await updateMembershipRole(membershipId, role);
  }

  return (
    <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <select
        name="role"
        defaultValue={currentRole}
        style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #ece2d2", background: "#fff", fontSize: 14, color: "#2a1f16", cursor: "pointer" }}
      >
        {ROLE_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <button
        type="submit"
        style={{ padding: "9px", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "none", background: "#c0563d", color: "white", cursor: "pointer" }}
      >
        Update Role
      </button>
    </form>
  );
}
