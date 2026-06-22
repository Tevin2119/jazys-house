"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { sendMessageFromCenter } from "@/app/(admin)/admin/messages/actions";

type MessageItem = {
  id: string;
  content: string;
  side: string;
  senderName: string;
  isInternal: boolean;
  createdAt: string;
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

export function MessageThread({
  orderId,
  customerName,
  messages,
}: {
  orderId: string;
  customerName: string;
  messages: MessageItem[];
}) {
  const [showInternal, setShowInternal] = useState(false);
  const [isInternal, setIsInternal]     = useState(false);
  const [isPending, startTransition]    = useTransition();
  const router  = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const visible = messages.filter((m) => !m.isInternal || showInternal);

  function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("isInternal", String(isInternal));
    startTransition(async () => {
      await sendMessageFromCenter(fd);
      router.refresh();
      formRef.current?.reset();
      setIsInternal(false);
    });
  }

  return (
    <>
      {/* Header */}
      <div style={{ padding: "12px 18px", borderBottom: "1px solid #f0e8da", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#2a1f16" }}>{customerName}</div>
          <div style={{ fontSize: 11, color: "#8a7c6a" }}>Order #{orderId.slice(0, 8)}</div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b5d4f", cursor: "pointer" }}>
          <input type="checkbox" checked={showInternal} onChange={(e) => setShowInternal(e.target.checked)} />
          内部メモ
        </label>
      </div>

      {/* Thread */}
      <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14, minHeight: 300 }}>
        {visible.length === 0 ? (
          <div style={{ textAlign: "center", color: "#8a7c6a", fontSize: 13, paddingTop: 40 }}>
            メッセージはまだありません
          </div>
        ) : (
          visible.map((msg) => {
            const isCustomer = msg.side === "CUSTOMER";
            return (
              <div
                key={msg.id}
                style={{ display: "flex", flexDirection: "column", alignItems: isCustomer ? "flex-start" : "flex-end" }}
              >
                <div style={{ fontSize: 10, color: "#a39685", marginBottom: 3 }}>
                  {msg.senderName} · {fmtDate(msg.createdAt)}
                  {msg.isInternal && " · 内部メモ"}
                </div>
                <div style={{
                  background: msg.isInternal ? "#fef9c3" : isCustomer ? "#f5f0ea" : "#c0563d",
                  color:      msg.isInternal ? "#7c6800" : isCustomer ? "#2a1f16" : "white",
                  padding: "9px 14px",
                  borderRadius: isCustomer ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                  fontSize: 14,
                  maxWidth: "72%",
                  border: msg.isInternal ? "1px solid #fde68a" : "none",
                }}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply form */}
      <div style={{ borderTop: "1px solid #f0e8da", padding: "14px 18px" }}>
        <form ref={formRef} onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input type="hidden" name="orderId" value={orderId} />
          <textarea
            name="content"
            placeholder="返信を入力..."
            required
            rows={2}
            style={{
              width: "100%",
              border: "1px solid #e6dccb",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 14,
              resize: "vertical",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b5d4f", cursor: "pointer" }}>
              <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
              内部メモ
            </label>
            <button
              type="submit"
              disabled={isPending}
              style={{
                background: "#c0563d",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "7px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: isPending ? "not-allowed" : "pointer",
                opacity: isPending ? 0.7 : 1,
              }}
            >
              {isPending ? "送信中..." : "送信"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
