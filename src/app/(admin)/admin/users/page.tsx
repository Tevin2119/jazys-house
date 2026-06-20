export const dynamic = "force-dynamic";

import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ROLE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  SUPER_ADMIN:  { bg: "#e2dcf2", color: "#5a4a9a", label: "Super Admin" },
  TENANT_ADMIN: { bg: "#d8e6f5", color: "#2f5d8a", label: "Tenant Admin" },
  CUSTOMER:     { bg: "#d8ecd9", color: "#2f6b3a", label: "Customer" },
};

export default async function UsersPage() {
  await requireSuperAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      memberships: { include: { tenant: { select: { id: true, name: true } } } },
      tenant: { select: { id: true, name: true } },
    },
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 22,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Marcellus', serif",
              fontSize: 30,
              margin: "0 0 4px",
              fontWeight: 400,
            }}
          >
            Users
          </h1>
          <p style={{ fontSize: 14, color: "#6b5d4f", margin: 0 }}>
            {users.length} user{users.length !== 1 ? "s" : ""} across all stores
          </p>
        </div>
        <a
          href="/admin/users/new"
          style={{
            background: "#c0563d",
            color: "#fff",
            border: "none",
            borderRadius: 9,
            padding: "11px 20px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          + Add User
        </a>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {users.map((u) => {
          const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE.CUSTOMER;
          const stores = u.memberships.map((m) => m.tenant.name).join(", ") || u.tenant?.name || "—";
          return (
            <div
              key={u.id}
              style={{
                background: "#fffdf9",
                border: "1px solid #ece2d2",
                borderRadius: 12,
                padding: "13px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#2a1f16" }}>
                  {u.name ?? "—"}
                </div>
                <div style={{ fontSize: 12, color: "#6b5d4f" }}>{u.email}</div>
                <div style={{ fontSize: 11.5, color: "#8a7c6a", marginTop: 2 }}>
                  {stores}
                </div>
              </div>
              <span
                style={{
                  background: badge.bg,
                  color: badge.color,
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div
        className="hidden md:block"
        style={{
          background: "#fffdf9",
          border: "1px solid #ece2d2",
          borderRadius: 13,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1.8fr 0.9fr 1.2fr 0.5fr",
            padding: "13px 22px",
            fontSize: 11,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#a39685",
            fontWeight: 700,
            borderBottom: "1px solid #f0e8da",
          }}
        >
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Store(s)</span>
          <span />
        </div>

        {users.length === 0 ? (
          <div
            style={{
              padding: "40px 22px",
              textAlign: "center",
              color: "#8a7c6a",
              fontSize: 14,
            }}
          >
            No users found
          </div>
        ) : (
          users.map((u) => {
            const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE.CUSTOMER;
            const stores =
              u.memberships.map((m) => m.tenant.name).join(", ") ||
              u.tenant?.name ||
              "—";
            return (
              <div
                key={u.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1.8fr 0.9fr 1.2fr 0.5fr",
                  padding: "14px 22px",
                  fontSize: 14,
                  alignItems: "center",
                  borderBottom: "1px solid #f4ecde",
                }}
              >
                <span style={{ fontWeight: 600, color: "#2a1f16" }}>
                  {u.name ?? <span style={{ color: "#8a7c6a" }}>—</span>}
                </span>
                <span style={{ color: "#6b5d4f" }}>{u.email}</span>
                <span>
                  <span
                    style={{
                      background: badge.bg,
                      color: badge.color,
                      padding: "3px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {badge.label}
                  </span>
                </span>
                <span style={{ color: "#6b5d4f", fontSize: 13 }}>{stores}</span>
                <a
                  href={`/admin/users/${u.id}/edit`}
                  style={{
                    color: "#c0563d",
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: "none",
                  }}
                >
                  Edit
                </a>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
