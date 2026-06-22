"use client";

import { useState } from "react";

interface EmailTemplate {
  key: string;
  name: string;
  nameJa: string;
  subject: string;
  status: "active" | "draft";
  trigger: string;
}

const TEMPLATES: EmailTemplate[] = [
  { key: "order_confirmation",   name: "Order Confirmation",   nameJa: "ご注文確認",   subject: "ご注文ありがとうございます — #{order_id}", status: "active", trigger: "Order placed"     },
  { key: "shipping_notification",name: "Shipping Notification",nameJa: "発送のお知らせ",subject: "ご注文の商品を発送しました — #{tracking}",   status: "active", trigger: "Order shipped"    },
  { key: "delivery_confirmation",name: "Delivery Confirmation",nameJa: "配達完了",     subject: "商品が届きましたか？",                       status: "active", trigger: "Order delivered"  },
  { key: "catering_quote",       name: "Catering Quote",       nameJa: "お見積もり",   subject: "ケータリングお見積もりのご提案",               status: "draft",  trigger: "Catering quoted" },
  { key: "password_reset",       name: "Password Reset",       nameJa: "パスワードリセット", subject: "パスワードリセットのご案内",             status: "active", trigger: "Reset requested" },
];

export function EmailTemplatesClient() {
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  function openEdit(t: EmailTemplate) {
    setEditing(t);
    setSubject(t.subject);
    setSaved(null);
  }

  function closeEdit() {
    setEditing(null);
  }

  function handleSave() {
    // In production, this would call a server action to persist the template
    setSaved(editing?.key ?? null);
    setEditing(null);
  }

  return (
    <>
      {/* Template list */}
      <div style={{ background: "#fffdf9", border: "1px solid #ece2d2", borderRadius: 13, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 100px", padding: "12px 22px", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#a39685", fontWeight: 700, borderBottom: "1px solid #ece2d2" }}>
          <span>Template</span><span>Trigger</span><span>Status</span><span />
        </div>
        {TEMPLATES.map((t) => (
          <div key={t.key} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 100px", padding: "16px 22px", fontSize: 14, alignItems: "center", borderBottom: "1px solid #f4ecde" }}>
            <div>
              <div style={{ fontWeight: 600, color: "#2a1f16" }}>{t.name}</div>
              <div style={{ fontSize: 12, color: "#8a7c6a", marginTop: 2 }}>{t.nameJa}</div>
            </div>
            <span style={{ fontSize: 12, color: "#6b5d4f" }}>{t.trigger}</span>
            <span>
              {t.status === "active" ? (
                <span style={{ background: "#d8ecd9", color: "#2f6b3a", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>Active</span>
              ) : (
                <span style={{ background: "#f0e8da", color: "#6b5d4f", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>Draft</span>
              )}
              {saved === t.key && <span style={{ marginLeft: 8, fontSize: 11, color: "#2f9e44", fontWeight: 600 }}>✓</span>}
            </span>
            <button
              onClick={() => openEdit(t)}
              style={{ padding: "6px 14px", fontSize: 12, fontWeight: 700, borderRadius: 7, border: "1px solid #ece2d2", background: "#fffdf9", color: "#6b5d4f", cursor: "pointer" }}
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fffdf9", borderRadius: 16, padding: "28px 32px", width: "100%", maxWidth: 540, boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
            <div style={{ fontFamily: "'Marcellus', serif", fontSize: 20, marginBottom: 4 }}>{editing.name}</div>
            <div style={{ fontSize: 13, color: "#8a7c6a", marginBottom: 20 }}>{editing.nameJa} · Trigger: {editing.trigger}</div>

            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6b5d4f", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Email Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ece2d2", background: "#fff", fontSize: 14, marginBottom: 16, boxSizing: "border-box" }}
            />

            <div style={{ background: "#f3ede2", borderRadius: 10, padding: "16px", fontSize: 13, color: "#6b5d4f", marginBottom: 20 }}>
              <strong>Note:</strong> Full template body editing will be available once the EmailTemplate schema is migrated. You can edit the subject line now.
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={closeEdit} style={{ padding: "9px 20px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "1px solid #ece2d2", background: "#fffdf9", color: "#6b5d4f", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSave} style={{ padding: "9px 20px", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "none", background: "#c0563d", color: "white", cursor: "pointer" }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
