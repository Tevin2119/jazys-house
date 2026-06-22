export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAdminContext } from "@/lib/auth";

const SETTINGS_NAV = [
  { href: "/admin/settings",                 label: "Store"           },
  { href: "/admin/settings/carriers",        label: "Carriers"        },
  { href: "/admin/settings/email-templates", label: "Email Templates" },
  { href: "/admin/settings/shipping-rates",  label: "Shipping Rates"  },
];

// Static placeholder data — replace with DB query once ShippingRate model is added
const RATE_TABLE = [
  { region: "Kanto (関東)",       weight: "0–500g",  standard: "¥550",  express: "¥800"  },
  { region: "Kanto (関東)",       weight: "500g–2kg", standard: "¥650", express: "¥950"  },
  { region: "Kansai (関西)",      weight: "0–500g",  standard: "¥600",  express: "¥850"  },
  { region: "Kansai (関西)",      weight: "500g–2kg", standard: "¥700", express: "¥1,000"},
  { region: "Tohoku (東北)",      weight: "0–500g",  standard: "¥700",  express: "¥950"  },
  { region: "Tohoku (東北)",      weight: "500g–2kg", standard: "¥800", express: "¥1,100"},
  { region: "Okinawa (沖縄)",     weight: "0–500g",  standard: "¥1,200",express: "¥1,600"},
  { region: "Okinawa (沖縄)",     weight: "500g–2kg", standard: "¥1,400",express: "¥1,800"},
];

export default async function ShippingRatesPage(): Promise<React.ReactElement> {
  await getAdminContext();

  return (
    <div>
      <h1 style={{ fontFamily: "'Marcellus', serif", fontSize: 30, margin: "0 0 4px", fontWeight: 400 }}>Settings</h1>
      <p style={{ fontSize: 14, color: "#6b5d4f", margin: "0 0 20px" }}>Configure shipping rates by weight and region.</p>

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
              background: n.label === "Shipping Rates" ? "#fffdf9" : "transparent",
              color: n.label === "Shipping Rates" ? "#c0563d" : "#6b5d4f",
              borderBottom: n.label === "Shipping Rates" ? "2px solid #c0563d" : "2px solid transparent",
            }}
          >
            {n.label}
          </Link>
        ))}
      </div>

      {/* Pending notice */}
      <div style={{ background: "#fbe5cf", border: "1px solid #f0c090", borderRadius: 10, padding: "14px 18px", marginBottom: 24, fontSize: 13, color: "#9a6b1e" }}>
        <strong>Schema migration pending:</strong> The ShippingRate model has not been applied yet. Rates below are illustrative. Once the migration runs, rates will be stored per-tenant and fully editable.
      </div>

      {/* Rate table */}
      <div style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13, overflow: "hidden", marginBottom: 22 }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #ece2d2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'Marcellus', serif", fontSize: 17 }}>Rate Table (JPY)</span>
          <button
            disabled
            style={{ padding: "7px 16px", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "none", background: "#e5d9cc", color: "#a39685", cursor: "not-allowed" }}
          >
            + Add Rate
          </button>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ece2d2" }}>
              {["Region", "Weight Band", "Standard", "Express"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "11px 22px", fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: "#a39685", fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RATE_TABLE.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f4ecde", background: i % 2 === 0 ? "transparent" : "#fdf8f2" }}>
                <td style={{ padding: "13px 22px", fontWeight: r.weight === "0–500g" ? 600 : 400, color: "#2a1f16" }}>{r.region}</td>
                <td style={{ padding: "13px 22px", color: "#6b5d4f" }}>{r.weight}</td>
                <td style={{ padding: "13px 22px", fontWeight: 700, color: "#2a1f16" }}>{r.standard}</td>
                <td style={{ padding: "13px 22px", fontWeight: 700, color: "#2a1f16" }}>{r.express}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Free shipping threshold */}
      <div style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13, padding: "20px 22px" }}>
        <div style={{ fontFamily: "'Marcellus', serif", fontSize: 16, marginBottom: 12 }}>Free Shipping Threshold</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, color: "#6b5d4f" }}>Orders over</span>
          <input
            type="text"
            defaultValue="¥5,000"
            disabled
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ece2d2", background: "#f8f4ef", fontSize: 14, width: 100, color: "#8a7c6a" }}
          />
          <span style={{ fontSize: 14, color: "#6b5d4f" }}>ship free (all regions)</span>
          <span style={{ fontSize: 12, color: "#a39685", marginLeft: 4 }}>· Schema migration required to edit</span>
        </div>
      </div>
    </div>
  );
}
