"use client";

import { useRouter, usePathname } from "next/navigation";

const CHIPS = [
  { key: "today", labelJa: "今日",  labelEn: "Today" },
  { key: "week",  labelJa: "今週",  labelEn: "Week" },
  { key: "month", labelJa: "今月",  labelEn: "Month" },
] as const;

export function DateFilterChips({ active }: { active: string }) {
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {CHIPS.map(c => {
        const isActive = active === c.key;
        return (
          <button
            key={c.key}
            onClick={() => router.push(`${pathname}?dateFilter=${c.key}`)}
            style={{
              padding: "6px 16px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: isActive ? "1px solid #c0563d" : "1px solid #ece2d2",
              background: isActive ? "#c0563d" : "#fffdf9",
              color: isActive ? "white" : "#6b5d4f",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {c.labelJa}
            <span style={{ marginLeft: 4, opacity: 0.7, fontSize: 11 }}>({c.labelEn})</span>
          </button>
        );
      })}
    </div>
  );
}
