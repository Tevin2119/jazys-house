export const dynamic = "force-dynamic";

import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";

const ROLE_LABELS: Partial<Record<UserRole, string>> = {
  OWNER:       "Owner",
  ADMIN:       "Admin",
  EMPLOYEE:    "Employee",
  TENANT_ADMIN: "Admin",
};

const ROLE_COLORS: Partial<Record<UserRole, { bg: string; color: string }>> = {
  OWNER:       { bg: "#fbe5cf", color: "#9a6b1e" },
  ADMIN:       { bg: "#d8e6f5", color: "#2f5d8a" },
  TENANT_ADMIN: { bg: "#d8e6f5", color: "#2f5d8a" },
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

export default async function EmployeesPage(): Promise<React.ReactElement> {
  const { tenantId } = await getAdminContext();

  const memberships = await prisma.tenantMembership.findMany({
    where:   { tenantId },
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
    orderBy: { createdAt: "asc" },
  });

  const ADMIN_ROLES: UserRole[] = ["OWNER", "ADMIN", "TENANT_ADMIN", "EMPLOYEE"];
  const employees = memberships.filter((m) => ADMIN_ROLES.includes(m.role));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Marcellus', serif", fontSize: 30, margin: 0, fontWeight: 400 }}>
          Employees
        </h1>
        <div style={{ fontSize: 13, color: "#8a7c6a" }}>
          {employees.length} member{employees.length !== 1 ? "s" : ""}
        </div>
      </div>

      {employees.length === 0 ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "#8a7c6a", fontSize: 14 }}>
          No employees found for this store.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {employees.map((m) => {
            const role   = ROLE_LABELS[m.role] ?? m.role;
            const colors = ROLE_COLORS[m.role] ?? { bg: "#f0e8da", color: "#6b5d4f" };
            const init   = initials(m.user.name, m.user.email);
            const bg     = avatarColor(m.user.id);

            return (
              <div
                key={m.id}
                style={{
                  background: "#fffdf9",
                  border: "1px solid #ece2d2",
                  borderRadius: 14,
                  padding: "20px 18px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  textAlign: "center",
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: bg,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: -0.5,
                  flexShrink: 0,
                }}>
                  {init}
                </div>

                {/* Name & Email */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#2a1f16" }}>
                    {m.user.name ?? "—"}
                  </div>
                  <div style={{ fontSize: 12, color: "#8a7c6a", marginTop: 2 }}>
                    {m.user.email}
                  </div>
                </div>

                {/* Role badge */}
                <span style={{
                  background: colors.bg,
                  color:      colors.color,
                  padding: "4px 14px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                }}>
                  {role}
                </span>

                {/* Active status + joined */}
                <div style={{ fontSize: 11, color: "#a39685" }}>
                  <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#4ade80", marginRight: 4 }} />
                  Active · Joined {m.user.createdAt.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
