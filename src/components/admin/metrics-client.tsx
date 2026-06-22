"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

type TrendDir = "up" | "down" | "neutral";

interface KPI {
  label: string;
  value: string;
  sub: string;
  trend?: TrendDir;
}

interface RevenuePoint { month: string; value: number }
interface StatusCount  { status: string; count: number }
interface TopProduct   { id: string; name: string; units: number }

export interface MetricsClientProps {
  currency: string;
  kpis: KPI[];
  revenueChart: RevenuePoint[];
  ordersByStatus: StatusCount[];
  topProducts: TopProduct[];
  inventory: { inStock: number; lowStock: number; outOfStock: number };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:       "#f0922b",
  PROCESSING:    "#4a9edd",
  LABEL_CREATED: "#7950f2",
  SHIPPED:       "#9775fa",
  IN_TRANSIT:    "#5c7cfa",
  DELIVERED:     "#2f9e44",
  CANCELLED:     "#e03131",
  REFUNDED:      "#e8590c",
};

function TrendArrow({ dir }: { dir: TrendDir }) {
  if (dir === "up")   return <span style={{ color: "#2f9e44", fontSize: 20, lineHeight: 1, fontWeight: 900 }}>↑</span>;
  if (dir === "down") return <span style={{ color: "#e03131", fontSize: 20, lineHeight: 1, fontWeight: 900 }}>↓</span>;
  return <span style={{ color: "#a39685", fontSize: 20, lineHeight: 1 }}>→</span>;
}

function RevLineChart({ data, currency }: { data: RevenuePoint[]; currency: string }) {
  if (data.length < 2) {
    return <div style={{ padding: "32px", textAlign: "center", color: "#a39685", fontSize: 14 }}>No revenue data yet.</div>;
  }
  const W = 560, H = 160;
  const PL = 68, PR = 16, PT = 14, PB = 28;
  const cW = W - PL - PR;
  const cH = H - PT - PB;
  const maxV = Math.max(...data.map(d => d.value), 1);
  const xStep = cW / (data.length - 1);

  const pts = data.map((d, i) => ({
    x: PL + i * xStep,
    y: PT + cH * (1 - d.value / maxV),
    month: d.month,
    value: d.value,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${(PT + cH).toFixed(1)} L${pts[0].x.toFixed(1)},${(PT + cH).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#c0563d" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#c0563d" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map(f => {
        const y = PT + cH * (1 - f);
        return (
          <g key={f}>
            <line x1={PL} y1={y} x2={PL + cW} y2={y} stroke="#ece2d2" strokeWidth={0.8} />
            <text x={PL - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#a39685">
              {formatPrice(Math.round(maxV * f), currency)}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#revAreaGrad)" />
      <path d={linePath} fill="none" stroke="#c0563d" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(p => (
        <circle key={p.month} cx={p.x} cy={p.y} r={3.5} fill="#c0563d" stroke="#fffdf9" strokeWidth={1.5} />
      ))}
      {pts.filter((_, i) => i % 2 === 0 || i === pts.length - 1).map(p => (
        <text key={p.month} x={p.x} y={H - 2} textAnchor="middle" fontSize={9} fill="#a39685">
          {p.month}
        </text>
      ))}
    </svg>
  );
}

function OrdersBarChart({ data }: { data: StatusCount[] }) {
  if (data.length === 0) {
    return <div style={{ padding: "24px", color: "#a39685", fontSize: 14 }}>No orders yet.</div>;
  }
  const barH = 22, gap = 9;
  const H = data.length * (barH + gap) + 20;
  const W = 480;
  const PL = 108, PR = 48, PT = 10;
  const cW = W - PL - PR;
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {data.map((d, i) => {
        const y = PT + i * (barH + gap);
        const barW = Math.max((d.count / maxCount) * cW, 3);
        const color = STATUS_COLORS[d.status] ?? "#adb5bd";
        const label = d.status.replace(/_/g, " ");
        return (
          <g key={d.status}>
            <text x={PL - 8} y={y + barH * 0.70} textAnchor="end" fontSize={10} fill="#6b5d4f">{label}</text>
            <rect x={PL} y={y} width={barW} height={barH} rx={4} fill={color} fillOpacity={0.85} />
            <text x={PL + barW + 7} y={y + barH * 0.70} fontSize={10} fill="#2a1f16" fontWeight="700">{d.count}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function MetricsClient({
  currency,
  kpis,
  revenueChart,
  ordersByStatus,
  topProducts,
  inventory,
}: MetricsClientProps) {
  const [layout, setLayout] = useState<"grid" | "focus">("grid");

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "'Marcellus', serif", fontSize: 30, margin: "0 0 4px", fontWeight: 400 }}>Metrics</h1>
          <p style={{ fontSize: 14, color: "#6b5d4f", margin: 0 }}>Store performance at a glance.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setLayout(l => l === "grid" ? "focus" : "grid")}
            style={{ padding: "7px 14px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "1px solid #ece2d2", background: "#fffdf9", cursor: "pointer", color: "#6b5d4f" }}
          >
            {layout === "grid" ? "⊞ Grid" : "⊡ Focus"}
          </button>
          <Link
            href="/admin/query-builder"
            style={{ padding: "7px 14px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "1px solid #c0563d", background: "#c0563d", textDecoration: "none", color: "white" }}
          >
            + Custom Metric
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: layout === "focus"
          ? "2fr 1fr 1fr 1fr"
          : "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 18, marginBottom: 26,
      }}>
        {kpis.map((k, idx) => (
          <div key={k.label} style={{
            background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13,
            padding: layout === "focus" && idx === 0 ? "26px 26px" : "20px 22px",
          }}>
            <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#a3442e", fontWeight: 700 }}>{k.label}</div>
            <div style={{ fontFamily: "'Marcellus', serif", fontSize: layout === "focus" && idx === 0 ? 40 : 32, margin: "8px 0 4px", color: "#2a1f16", display: "flex", alignItems: "center", gap: 6 }}>
              {k.value}
              {k.trend && <TrendArrow dir={k.trend} />}
            </div>
            <div style={{ fontSize: 12.5, color: "#6b8a5c", fontWeight: 600 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div
        style={{ display: "grid", gridTemplateColumns: layout === "focus" ? "1fr" : "1.6fr 1fr", gap: 22, marginBottom: 26, alignItems: "start" }}
        className="max-lg:flex max-lg:flex-col"
      >
        <div style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #ece2d2", fontFamily: "'Marcellus', serif", fontSize: 17 }}>
            Revenue Trend — 12 Months
          </div>
          <div style={{ padding: "16px 16px 8px" }}>
            <RevLineChart data={revenueChart} currency={currency} />
          </div>
        </div>
        <div style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #ece2d2", fontFamily: "'Marcellus', serif", fontSize: 17 }}>
            Orders by Status
          </div>
          <div style={{ padding: "16px 16px 8px" }}>
            <OrdersBarChart data={ordersByStatus} />
          </div>
        </div>
      </div>

      {/* Bottom: Top Products + Inventory */}
      <div
        style={{ display: "grid", gridTemplateColumns: layout === "focus" ? "1fr" : "1fr 1fr", gap: 22, alignItems: "start" }}
        className="max-lg:flex max-lg:flex-col"
      >
        <div style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #ece2d2", fontFamily: "'Marcellus', serif", fontSize: 17 }}>
            Top Products by Units Sold
          </div>
          {topProducts.length === 0 ? (
            <div style={{ padding: "24px 22px", color: "#8a7c6a", fontSize: 14 }}>No sales data yet.</div>
          ) : topProducts.map((p, i) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 22px", borderBottom: "1px solid #f4ecde", fontSize: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "#f3ede2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#6b5d4f", flexShrink: 0 }}>
                  {i + 1}
                </span>
                <span style={{ fontWeight: 600 }}>{p.name}</span>
              </div>
              <span style={{ color: "#6b5d4f" }}>{p.units} units</span>
            </div>
          ))}
        </div>

        <div style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13, padding: "18px 22px" }}>
          <div style={{ fontFamily: "'Marcellus', serif", fontSize: 17, marginBottom: 14 }}>Inventory Health</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div style={{ background: "#d8ecd9", borderRadius: 10, padding: "14px 14px", color: "#2f6b3a" }}>
              <div style={{ fontSize: 28, fontFamily: "'Marcellus', serif" }}>{inventory.inStock}</div>
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>In Stock</div>
            </div>
            <div style={{ background: "#fbe5cf", borderRadius: 10, padding: "14px 14px", color: "#9a6b1e" }}>
              <div style={{ fontSize: 28, fontFamily: "'Marcellus', serif" }}>{inventory.lowStock}</div>
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>Low Stock</div>
            </div>
            <div style={{ background: "#f3dad4", borderRadius: 10, padding: "14px 14px", color: "#a3442e" }}>
              <div style={{ fontSize: 28, fontFamily: "'Marcellus', serif" }}>{inventory.outOfStock}</div>
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>Out of Stock</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
