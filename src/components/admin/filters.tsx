"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Build the next URL for a single param change, always resetting pagination. */
function buildHref(
  pathname: string,
  params: URLSearchParams,
  key: string,
  value: string | null,
): string {
  const next = new URLSearchParams(params.toString());
  if (value) next.set(key, value);
  else next.delete(key);
  next.delete("page");
  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** Debounced free-text search bound to a URL search param (default `q`). */
export function SearchInput({
  paramKey = "q",
  placeholder = "Search…",
}: {
  paramKey?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get(paramKey) ?? "");
  const [, startTransition] = useTransition();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const handle = setTimeout(() => {
      startTransition(() => {
        router.replace(buildHref(pathname, params, paramKey, value || null));
      });
    }, 300);
    return () => clearTimeout(handle);
    // params/pathname intentionally excluded — we react to typing only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  );
}

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Dropdown filter bound to a URL param. The "all" sentinel clears the param
 * (Radix Select forbids empty-string item values).
 */
export function SelectFilter({
  paramKey,
  placeholder,
  options,
  className,
}: {
  paramKey: string;
  placeholder: string;
  options: FilterOption[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get(paramKey) ?? "all";

  function onChange(value: string) {
    router.replace(
      buildHref(pathname, params, paramKey, value === "all" ? null : value),
    );
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-[170px]"}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Horizontal pill-button filter row bound to a URL param.
 * Replaces the SelectFilter dropdown with inline pill buttons.
 */
export function StatusPillFilter({
  paramKey,
  placeholder,
  options,
}: {
  paramKey: string;
  placeholder: string;
  options: FilterOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get(paramKey) ?? "all";

  function select(value: string) {
    router.replace(
      buildHref(pathname, params, paramKey, value === "all" ? null : value),
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden">
      <button
        onClick={() => select("all")}
        className={cn(
          "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
          current === "all"
            ? "border-[#c0563d] bg-[#c0563d] text-white"
            : "border-border bg-card text-muted-foreground hover:border-[#c0563d] hover:text-[#c0563d]",
        )}
      >
        {placeholder}
      </button>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => select(o.value)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            current === o.value
              ? "border-[#c0563d] bg-[#c0563d] text-white"
              : "border-border bg-card text-muted-foreground hover:border-[#c0563d] hover:text-[#c0563d]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
