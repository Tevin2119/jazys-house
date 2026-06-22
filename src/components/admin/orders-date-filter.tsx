"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const DATE_CHIPS = [
  { value: "today", label: "今日" },
  { value: "week",  label: "今週" },
  { value: "month", label: "今月" },
] as const;

export function OrdersDateFilter() {
  const router      = useRouter();
  const pathname    = usePathname();
  const params      = useSearchParams();
  const current     = params.get("date") ?? "";

  function select(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === current) {
      next.delete("date");
    } else {
      next.set("date", value);
    }
    next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
      {DATE_CHIPS.map((chip) => (
        <button
          key={chip.value}
          onClick={() => select(chip.value)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            current === chip.value
              ? "border-[#c0563d] bg-[#c0563d] text-white"
              : "border-border bg-card text-muted-foreground hover:border-[#c0563d] hover:text-[#c0563d]",
          )}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
