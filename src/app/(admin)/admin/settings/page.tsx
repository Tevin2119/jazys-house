export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveTheme } from "@/lib/theme";
import { SettingsForm } from "@/components/admin/settings-form";

const SETTINGS_NAV = [
  { href: "/admin/settings",                 label: "Store"           },
  { href: "/admin/settings/carriers",        label: "Carriers"        },
  { href: "/admin/settings/email-templates", label: "Email Templates" },
  { href: "/admin/settings/shipping-rates",  label: "Shipping Rates"  },
];

export default async function SettingsPage() {
  const { tenantId } = await getAdminContext();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });
  if (!tenant) notFound();

  const theme = resolveTheme(tenant.theme);

  return (
    <div>
      <h1 style={{ fontFamily: "'Marcellus', serif", fontSize: 30, margin: "0 0 4px", fontWeight: 400 }}>
        Settings
      </h1>
      <p style={{ fontSize: 14, color: "#6b5d4f", margin: "0 0 20px" }}>Manage your store details and configuration.</p>

      {/* Sub-nav */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #ece2d2", marginBottom: 28, flexWrap: "wrap" }}>
        {SETTINGS_NAV.map(n => (
          <Link
            key={n.href}
            href={n.href}
            style={{
              padding: "8px 16px", fontSize: 13, fontWeight: 600,
              borderRadius: "8px 8px 0 0", textDecoration: "none",
              background: n.label === "Store" ? "#fffdf9" : "transparent",
              color: n.label === "Store" ? "#c0563d" : "#6b5d4f",
              borderBottom: n.label === "Store" ? "2px solid #c0563d" : "2px solid transparent",
            }}
          >
            {n.label}
          </Link>
        ))}
      </div>

      <SettingsForm
        name={tenant.name}
        currency={tenant.currency}
        primary={theme.primary}
        slug={tenant.slug}
        domain={tenant.domain}
      />
    </div>
  );
}
