export const dynamic = "force-dynamic";

import type { RefundStage } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { RefundReviewPanel } from "@/components/admin/refund-review-panel";

const STAGES: RefundStage[] = ["REQUESTED", "APPROVED", "PROCESSING", "COMPLETED"];

const STAGE_LABELS: Record<RefundStage, string> = {
  REQUESTED:  "依頼",
  APPROVED:   "承認",
  PROCESSING: "処理中",
  COMPLETED:  "完了",
};

const STAGE_COLORS: Record<RefundStage, { bg: string; color: string }> = {
  REQUESTED:  { bg: "#fbe5cf", color: "#9a6b1e" },
  APPROVED:   { bg: "#d8e6f5", color: "#2f5d8a" },
  PROCESSING: { bg: "#e2dcf2", color: "#5a4a9a" },
  COMPLETED:  { bg: "#d8ecd9", color: "#2f6b3a" },
};

export default async function RefundsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; review?: string }>;
}): Promise<React.ReactElement> {
  const { tenantId } = await getAdminContext();
  const { stage, review } = await searchParams;

  // Stage counts
  const counts = await prisma.refund.groupBy({
    by:    ["stage"],
    where: { tenantId },
    _count: true,
  });
  const countMap: Partial<Record<RefundStage, number>> = {};
  for (const c of counts) countMap[c.stage] = c._count;

  // Refund list (optionally filtered)
  const validStage = stage && (STAGES as string[]).includes(stage) ? (stage as RefundStage) : undefined;
  const refunds = await prisma.refund.findMany({
    where: { tenantId, ...(validStage ? { stage: validStage } : {}) },
    include: {
      order: { select: { email: true, name: true, currency: true, id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Review target
  const reviewRefund = review
    ? await prisma.refund.findFirst({
        where:   { id: review, tenantId },
        include: { order: { select: { id: true, email: true, name: true, currency: true, total: true } } },
      })
    : null;

  return (
    <div>
      <h1 style={{ fontFamily: "'Marcellus', serif", fontSize: 30, margin: "0 0 24px", fontWeight: 400 }}>
        Refunds
      </h1>

      {/* Stage pipeline */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {STAGES.map((s, i) => {
          const { bg, color } = STAGE_COLORS[s];
          const count = countMap[s] ?? 0;
          return (
            <div key={s} style={{ position: "relative" }}>
              <a
                href={s === validStage ? "/admin/refunds" : `/admin/refunds?stage=${s}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{
                  background: s === validStage ? bg : "#fffdf9",
                  border: `1px solid ${s === validStage ? color : "#ece2d2"}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: s === validStage ? color : "#2a1f16" }}>
                    {count}
                  </div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: s === validStage ? color : "#8a7c6a",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginTop: 4,
                  }}>
                    {STAGE_LABELS[s]}
                  </div>
                </div>
              </a>
              {i < STAGES.length - 1 && (
                <div style={{
                  position: "absolute",
                  right: -7,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 14,
                  color: "#c4b5a5",
                  zIndex: 1,
                }}>
                  ›
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Review panel */}
      {reviewRefund && (
        <div style={{ marginBottom: 24 }}>
          <RefundReviewPanel
            refund={{
              id:       reviewRefund.id,
              amount:   reviewRefund.amount,
              reason:   reviewRefund.reason,
              method:   reviewRefund.method,
              stage:    reviewRefund.stage,
              orderId:  reviewRefund.order.id,
              orderRef: reviewRefund.order.name ?? reviewRefund.order.email ?? reviewRefund.order.id.slice(0, 8),
              currency: reviewRefund.order.currency,
              createdAt: reviewRefund.createdAt.toISOString(),
            }}
          />
        </div>
      )}

      {/* Refund list */}
      <div style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13, overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "0.6fr 1.2fr 0.8fr 1.2fr 0.8fr 0.7fr 0.8fr 0.7fr",
          padding: "13px 22px",
          fontSize: 11,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "#a39685",
          fontWeight: 700,
          borderBottom: "1px solid #f0e8da",
        }}>
          <span>ID</span>
          <span>Customer</span>
          <span>Amount</span>
          <span>Reason</span>
          <span>Method</span>
          <span>Stage</span>
          <span>Date</span>
          <span>Action</span>
        </div>

        {refunds.length === 0 ? (
          <div style={{ padding: "40px 22px", textAlign: "center", color: "#8a7c6a", fontSize: 14 }}>
            No refunds found.
          </div>
        ) : (
          refunds.map((r) => {
            const { bg, color } = STAGE_COLORS[r.stage];
            const isReviewing = review === r.id;
            return (
              <div
                key={r.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "0.6fr 1.2fr 0.8fr 1.2fr 0.8fr 0.7fr 0.8fr 0.7fr",
                  padding: "13px 22px",
                  fontSize: 13,
                  alignItems: "center",
                  borderBottom: "1px solid #f4ecde",
                  background: isReviewing ? "#fdf6f0" : undefined,
                }}
              >
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#6b5d4f" }}>
                  {r.id.slice(0, 6)}
                </span>
                <div>
                  <div style={{ fontWeight: 600, color: "#2a1f16" }}>
                    {r.order.name ?? r.order.email ?? "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "#8a7c6a" }}>#{r.orderId.slice(0, 6)}</div>
                </div>
                <span style={{ fontWeight: 700, color: "#2a1f16" }}>
                  {formatPrice(r.amount, r.order.currency)}
                </span>
                <span style={{ color: "#6b5d4f", fontSize: 12 }}>
                  {r.reason ?? "—"}
                </span>
                <span style={{ color: "#6b5d4f", fontSize: 12 }}>
                  {r.method ?? "—"}
                </span>
                <span>
                  <span style={{ background: bg, color, padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {STAGE_LABELS[r.stage]}
                  </span>
                </span>
                <span style={{ fontSize: 12, color: "#8a7c6a" }}>
                  {r.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
                <span>
                  <a
                    href={isReviewing ? "/admin/refunds" : `/admin/refunds?review=${r.id}`}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: isReviewing ? "#8a7c6a" : "#c0563d",
                      textDecoration: "none",
                    }}
                  >
                    {isReviewing ? "閉じる" : "確認"}
                  </a>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
