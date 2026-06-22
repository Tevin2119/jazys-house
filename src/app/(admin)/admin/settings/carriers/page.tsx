export const dynamic = "force-dynamic";

import Link from "next/link";
import type { CarrierType } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateCarrierConfig } from "./actions";
import { TestConnectionButton } from "@/components/admin/test-connection-button";

const CARRIERS: { type: CarrierType; name: string; nameJa: string; icon: string }[] = [
  { type: "YAMATO",    name: "Yamato Transport",  nameJa: "ヤマト運輸",  icon: "🐱" },
  { type: "SAGAWA",   name: "Sagawa Express",    nameJa: "佐川急便",   icon: "📮" },
  { type: "JAPAN_POST", name: "Japan Post",      nameJa: "日本郵便",   icon: "📯" },
];

const SETTINGS_NAV = [
  { href: "/admin/settings",              label: "Store" },
  { href: "/admin/settings/carriers",     label: "Carriers" },
  { href: "/admin/settings/email-templates", label: "Email Templates" },
  { href: "/admin/settings/shipping-rates",  label: "Shipping Rates" },
];

export default async function CarriersSettingsPage(): Promise<React.ReactElement> {
  const { tenantId } = await getAdminContext();

  const configs = await prisma.tenantCarrier.findMany({
    where: { tenantId },
  });
  const configMap = Object.fromEntries(configs.map(c => [c.carrier, c]));

  return (
    <div>
      <h1 style={{ fontFamily: "'Marcellus', serif", fontSize: 30, margin: "0 0 4px", fontWeight: 400 }}>Settings</h1>
      <p style={{ fontSize: 14, color: "#6b5d4f", margin: "0 0 20px" }}>Carrier configuration for shipping label creation.</p>

      {/* Sub-nav */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #ece2d2", marginBottom: 28, flexWrap: "wrap" }}>
        {SETTINGS_NAV.map(n => (
          <Link
            key={n.href}
            href={n.href}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: "8px 8px 0 0",
              textDecoration: "none",
              background: n.label === "Carriers" ? "#fffdf9" : "transparent",
              color: n.label === "Carriers" ? "#c0563d" : "#6b5d4f",
              borderBottom: n.label === "Carriers" ? "2px solid #c0563d" : "2px solid transparent",
            }}
          >
            {n.label}
          </Link>
        ))}
      </div>

      {/* Carrier cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {CARRIERS.map(c => {
          const config = configMap[c.type];
          return (
            <div key={c.type} style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13, overflow: "hidden" }}>
              {/* Card header */}
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #ece2d2", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{c.icon}</span>
                  <div>
                    <div style={{ fontFamily: "'Marcellus', serif", fontSize: 17 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#8a7c6a" }}>{c.nameJa}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {config?.enabled ? (
                    <span style={{ background: "#d8ecd9", color: "#2f6b3a", padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>Enabled</span>
                  ) : (
                    <span style={{ background: "#f3dad4", color: "#a3442e", padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>Disabled</span>
                  )}
                </div>
              </div>

              {/* Config form */}
              <form action={updateCarrierConfig} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                <input type="hidden" name="carrier" value={c.type} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6b5d4f", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      API Key / Account Code
                    </label>
                    <input
                      type="password"
                      name="apiKey"
                      defaultValue={config?.apiKey ?? ""}
                      placeholder="••••••••"
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #ece2d2", background: "#fff", fontSize: 14, fontFamily: "monospace", boxSizing: "border-box" }}
                    />
                    <div style={{ fontSize: 11, color: "#a39685", marginTop: 4 }}>Stored encrypted. Leave blank to keep existing.</div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6b5d4f", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Origin Postal Code 〒
                    </label>
                    <input
                      type="text"
                      name="originPostalCode"
                      defaultValue={config?.originPostalCode ?? ""}
                      placeholder="123-4567"
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #ece2d2", background: "#fff", fontSize: 14, boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#2a1f16" }}>
                    <input
                      type="checkbox"
                      name="enabled"
                      defaultChecked={config?.enabled ?? false}
                      style={{ width: 16, height: 16, accentColor: "#c0563d" }}
                    />
                    Enable this carrier
                  </label>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="submit"
                    style={{ padding: "9px 22px", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "none", background: "#c0563d", color: "white", cursor: "pointer" }}
                  >
                    Save
                  </button>
                  <TestConnectionButton carrier={c.name} />
                </div>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
