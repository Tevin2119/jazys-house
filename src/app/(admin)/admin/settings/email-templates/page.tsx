export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAdminContext } from "@/lib/auth";
import { EmailTemplatesClient } from "@/components/admin/email-templates-client";

const SETTINGS_NAV = [
  { href: "/admin/settings",                 label: "Store"           },
  { href: "/admin/settings/carriers",        label: "Carriers"        },
  { href: "/admin/settings/email-templates", label: "Email Templates" },
  { href: "/admin/settings/shipping-rates",  label: "Shipping Rates"  },
];

export default async function EmailTemplatesPage(): Promise<React.ReactElement> {
  await getAdminContext(); // auth guard

  return (
    <div>
      <h1 style={{ fontFamily: "'Marcellus', serif", fontSize: 30, margin: "0 0 4px", fontWeight: 400 }}>Settings</h1>
      <p style={{ fontSize: 14, color: "#6b5d4f", margin: "0 0 20px" }}>Manage automated email templates sent to customers.</p>

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
              background: n.label === "Email Templates" ? "#fffdf9" : "transparent",
              color: n.label === "Email Templates" ? "#c0563d" : "#6b5d4f",
              borderBottom: n.label === "Email Templates" ? "2px solid #c0563d" : "2px solid transparent",
            }}
          >
            {n.label}
          </Link>
        ))}
      </div>

      <EmailTemplatesClient />
    </div>
  );
}
