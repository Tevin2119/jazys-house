"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/app/(admin)/admin/orders/actions";
import { STATUS_LABELS, ORDER_STYLES } from "@/components/admin/status-badge";

type OrderRow = {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  total: number;
  currency: string;
  itemCount: number;
  createdAt: string;
  isAging: boolean;
};

function fmtPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("ja-JP", {
    style:    "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(currency.toLowerCase() === "jpy" ? amount : amount / 100);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING:       { bg: "#fbe5cf", color: "#9a6b1e" },
  PROCESSING:    { bg: "#d8e6f5", color: "#2f5d8a" },
  LABEL_CREATED: { bg: "#dbeafe", color: "#1e4d8a" },
  SHIPPED:       { bg: "#e2dcf2", color: "#5a4a9a" },
  IN_TRANSIT:    { bg: "#ede9fe", color: "#6031a8" },
  DELIVERED:     { bg: "#d8ecd9", color: "#2f6b3a" },
  CANCELLED:     { bg: "#f3dad4", color: "#a3442e" },
  REFUNDED:      { bg: "#ffedd5", color: "#9a4b1a" },
};

const BULK_STATUSES = ["PROCESSING", "LABEL_CREATED", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED"] as const;

export function OrdersTableClient({
  orders,
  currency,
}: {
  orders: OrderRow[];
  currency: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [isBulkPending, startBulkTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === orders.length ? new Set() : new Set(orders.map((o) => o.id)),
    );
  }

  async function applyBulk() {
    if (!bulkStatus || selected.size === 0) return;
    startBulkTransition(async () => {
      for (const id of selected) {
        const fd = new FormData();
        fd.set("id", id);
        fd.set("status", bulkStatus);
        try {
          await updateOrderStatus(fd);
        } catch {
          // individual failures are acceptable (illegal transitions)
        }
      }
      setSelected(new Set());
      setBulkStatus("");
      router.refresh();
    });
  }

  const allChecked = orders.length > 0 && selected.size === orders.length;

  return (
    <div>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{
          background: "#2a1f16",
          color: "white",
          borderRadius: 10,
          padding: "10px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selected.size} selected</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            style={{
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 13,
              background: "rgba(255,255,255,0.08)",
              color: "white",
            }}
          >
            <option value="">Change status to…</option>
            {BULK_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
            ))}
          </select>
          <button
            onClick={applyBulk}
            disabled={!bulkStatus || isBulkPending}
            style={{
              background: "#c0563d",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "5px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: !bulkStatus || isBulkPending ? "not-allowed" : "pointer",
              opacity: !bulkStatus || isBulkPending ? 0.6 : 1,
            }}
          >
            {isBulkPending ? "Applying…" : "Apply"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            style={{ background: "none", border: "none", color: "#cbb9a3", cursor: "pointer", fontSize: 13 }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {orders.length === 0 ? (
          <p style={{ padding: "40px 0", textAlign: "center", color: "#8a7c6a", fontSize: 14 }}>No orders found.</p>
        ) : (
          orders.map((o) => {
            const badge = BADGE_COLORS[o.status] ?? BADGE_COLORS.PENDING;
            return (
              <Link key={o.id} href={`/admin/orders/${o.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "#fffdf9",
                  border: "1px solid #ece2d2",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#2a1f16", display: "flex", alignItems: "center", gap: 6 }}>
                      #{o.id.slice(0, 6)} · {o.name ?? "—"}
                      {o.isAging && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} title="Aging >48h" />}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b5d4f", marginTop: 2 }}>
                      {fmtPrice(o.total, o.currency)} · {fmtDate(o.createdAt)}
                    </div>
                  </div>
                  <span style={{ background: badge.bg, color: badge.color, padding: "4px 11px", borderRadius: 999, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block" style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13, overflow: "hidden" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "36px 0.7fr 1.5fr 0.5fr 0.7fr 1fr 0.8fr",
          padding: "13px 22px",
          fontSize: 11,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "#a39685",
          fontWeight: 700,
          borderBottom: "1px solid #f0e8da",
        }}>
          <span>
            <input
              type="checkbox"
              checked={allChecked}
              onChange={toggleAll}
              style={{ cursor: "pointer" }}
            />
          </span>
          <span>Order</span>
          <span>Customer</span>
          <span>Items</span>
          <span>Total</span>
          <span>Status</span>
          <span>Date</span>
        </div>

        {orders.length === 0 ? (
          <div style={{ padding: "40px 22px", textAlign: "center", color: "#8a7c6a", fontSize: 14 }}>
            No orders found.
          </div>
        ) : (
          orders.map((o) => {
            const badge = BADGE_COLORS[o.status] ?? BADGE_COLORS.PENDING;
            const isSelected = selected.has(o.id);
            return (
              <div
                key={o.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "36px 0.7fr 1.5fr 0.5fr 0.7fr 1fr 0.8fr",
                  padding: "14px 22px",
                  fontSize: 14,
                  alignItems: "center",
                  borderBottom: "1px solid #f4ecde",
                  background: isSelected ? "#fdf6f0" : undefined,
                }}
              >
                <span>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(o.id)}
                    style={{ cursor: "pointer" }}
                  />
                </span>
                <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                  <Link href={`/admin/orders/${o.id}`} style={{ color: "#2a1f16", textDecoration: "none" }}>
                    #{o.id.slice(0, 6)}
                  </Link>
                  {o.isAging && (
                    <span
                      style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block", flexShrink: 0 }}
                      title="Aging: >48h without completion"
                    />
                  )}
                </span>
                <span style={{ color: "#2a1f16" }}>{o.name ?? o.email ?? "—"}</span>
                <span style={{ color: "#6b5d4f" }}>{o.itemCount}</span>
                <span style={{ fontWeight: 700 }}>{fmtPrice(o.total, o.currency)}</span>
                <span>
                  <span style={{ background: badge.bg, color: badge.color, padding: "4px 11px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 0.4, whiteSpace: "nowrap" }}>
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </span>
                <span style={{ color: "#6b5d4f" }}>{fmtDate(o.createdAt)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
