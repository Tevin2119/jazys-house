"use client";

export function TestConnectionButton({ carrier }: { carrier: string }) {
  return (
    <button
      type="button"
      style={{ padding: "9px 22px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "1px solid #ece2d2", background: "#fffdf9", color: "#6b5d4f", cursor: "pointer" }}
      onClick={() => alert(`Test connection for ${carrier} — integration coming soon.`)}
    >
      Test Connection
    </button>
  );
}
