import { cn } from "@/lib/utils";

/**
 * Product badge pill. The static site uses a `badgeClass` modifier ("new",
 * "sale", or "") to tint the badge; we map that to brand-consistent colors.
 */
export function ProductBadge({
  label,
  badgeClass,
  className,
}: {
  label: string;
  badgeClass?: string | null;
  className?: string;
}) {
  const tone =
    badgeClass === "new"
      ? "bg-[var(--green)] text-white"
      : badgeClass === "sale"
        ? "bg-[var(--gold)] text-[#2c1810]"
        : "bg-primary text-primary-foreground";

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider shadow-sm",
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}
