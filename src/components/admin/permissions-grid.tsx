"use client";

import { useState, useTransition } from "react";
import type { UserRole } from "@prisma/client";
import { updateMembershipPermissions } from "@/app/(admin)/admin/employees/[id]/actions";

type PermAction = "view" | "edit" | "manage";

interface PermCategory {
  key: string;
  label: string;
  icon: string;
}

const CATEGORIES: PermCategory[] = [
  { key: "orders",    label: "Orders",    icon: "📦" },
  { key: "products",  label: "Products",  icon: "🧺" },
  { key: "customers", label: "Customers", icon: "👥" },
  { key: "catering",  label: "Catering",  icon: "🍲" },
  { key: "settings",  label: "Settings",  icon: "⚙️" },
  { key: "reports",   label: "Reports",   icon: "📈" },
  { key: "employees", label: "Employees", icon: "👤" },
];

const ACTIONS: { key: PermAction; label: string }[] = [
  { key: "view",   label: "View"   },
  { key: "edit",   label: "Edit"   },
  { key: "manage", label: "Manage" },
];

type PermSet = Record<string, Record<PermAction, boolean>>;

const DEFAULT_PERMISSIONS: Record<string, PermSet> = {
  OWNER: Object.fromEntries(CATEGORIES.map(c => [c.key, { view: true,  edit: true,  manage: true  }])),
  ADMIN: Object.fromEntries(CATEGORIES.map(c => [c.key, { view: true,  edit: ["orders","products","catering"].includes(c.key), manage: false }])),
  EMPLOYEE: Object.fromEntries(CATEGORIES.map(c => [c.key, { view: ["orders","products","catering"].includes(c.key), edit: false, manage: false }])),
};

function parsePermissions(raw: unknown, role: UserRole): PermSet {
  const defaults = DEFAULT_PERMISSIONS[role] ?? DEFAULT_PERMISSIONS.EMPLOYEE;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;
  return { ...defaults, ...(raw as PermSet) };
}

export function PermissionsGrid({
  membershipId,
  role,
  storedPermissions,
}: {
  membershipId: string;
  role: UserRole;
  storedPermissions: unknown;
}) {
  const [perms, setPerms] = useState<PermSet>(() => parsePermissions(storedPermissions, role));
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle(cat: string, action: PermAction) {
    setSaved(false);
    setPerms(prev => ({
      ...prev,
      [cat]: { ...prev[cat], [action]: !prev[cat]?.[action] },
    }));
  }

  function handleSave() {
    startTransition(async () => {
      await updateMembershipPermissions(membershipId, perms as Record<string, Record<string, boolean>>);
      setSaved(true);
    });
  }

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 12px 8px 0", color: "#a39685", fontWeight: 700, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", width: "50%" }}>
                Category
              </th>
              {ACTIONS.map(a => (
                <th key={a.key} style={{ textAlign: "center", padding: "8px 10px", color: "#a39685", fontWeight: 700, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", width: "50px" }}>
                  {a.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat, i) => (
              <tr key={cat.key} style={{ borderTop: "1px solid #f4ecde", background: i % 2 === 0 ? "transparent" : "#fdf8f2" }}>
                <td style={{ padding: "10px 12px 10px 0", fontWeight: 600, color: "#2a1f16" }}>
                  <span style={{ marginRight: 8 }}>{cat.icon}</span>{cat.label}
                </td>
                {ACTIONS.map(action => {
                  const checked = perms[cat.key]?.[action.key] ?? false;
                  return (
                    <td key={action.key} style={{ textAlign: "center", padding: "10px" }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(cat.key, action.key)}
                        style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#c0563d" }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
        <button
          onClick={handleSave}
          disabled={isPending}
          style={{ padding: "9px 22px", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "none", background: "#c0563d", color: "white", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? "Saving…" : "Save Permissions"}
        </button>
        {saved && <span style={{ fontSize: 13, color: "#2f9e44", fontWeight: 600 }}>✓ Saved</span>}
      </div>
    </div>
  );
}
