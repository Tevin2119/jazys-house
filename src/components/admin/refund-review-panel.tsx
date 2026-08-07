"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { advanceRefundStage } from "@/app/(admin)/admin/refunds/actions";

type RefundData = {
  id: string;
  amount: number;
  reason: string | null;
  method: string | null;
  stage: string;
  orderId: string;
  orderRef: string;
  currency: string;
  createdAt: string;
};

const STAGE_NEXT: Record<string, string> = {
  REQUESTED:  "Approve",
  APPROVED:   "Start Processing",
};

const STAGE_LABELS: Record<string, string> = {
  REQUESTED:  "依頼",
  APPROVED:   "承認",
  PROCESSING: "処理中",
  COMPLETED:  "完了",
};

function fmtCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("ja-JP", {
    style:    "currency",
      currency: currency.toUpperCase(),
  }).format(amount / (currency.toLowerCase() === "jpy" || currency.toLowerCase() === "xof" ? 1 : 100));
}

export function RefundReviewPanel({ refund }: { refund: RefundData }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAdvance() {
    const fd = new FormData();
    fd.set("refundId", refund.id);
    startTransition(async () => {
      await advanceRefundStage(fd);
      router.refresh();
    });
  }

  const nextLabel = STAGE_NEXT[refund.stage];

  return (
    <div style={{
      background: "#fffdf9",
      border: "1px solid #c0563d",
      borderRadius: 14,
      padding: 20,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "'Marcellus', serif", fontSize: 16, fontWeight: 400 }}>
            Refund Review
          </div>
          <div style={{ fontSize: 12, color: "#8a7c6a", marginTop: 2 }}>
            #{refund.id.slice(0, 8)}
          </div>
        </div>
        <span style={{
          background: "#fbe5cf",
          color: "#9a6b1e",
          padding: "4px 12px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
        }}>
          {STAGE_LABELS[refund.stage] ?? refund.stage}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Order", value: `#${refund.orderId.slice(0, 8)} · ${refund.orderRef}` },
          { label: "Amount", value: fmtCurrency(refund.amount, refund.currency) },
          { label: "Method", value: refund.method ?? "—" },
          { label: "Reason", value: refund.reason ?? "—" },
          { label: "Created", value: new Date(refund.createdAt).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" }) },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#a39685", fontWeight: 700, marginBottom: 3 }}>
              {label}
            </div>
            <div style={{ fontSize: 14, color: "#2a1f16", fontWeight: label === "Amount" ? 700 : 400 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {nextLabel && (
        <button
          onClick={handleAdvance}
          disabled={isPending}
          style={{
            background: "#c0563d",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "9px 20px",
            fontSize: 13,
            fontWeight: 600,
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? "Processing…" : nextLabel} →
        </button>
      )}

      {refund.stage === "COMPLETED" && (
        <div style={{ fontSize: 13, color: "#2f6b3a", fontWeight: 600 }}>
          ✓ Refund completed
        </div>
      )}
    </div>
  );
}
