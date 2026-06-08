import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Centered section heading: eyebrow label + display title + optional subtitle. */
export function SectionHeading({
  label,
  title,
  subtitle,
  className,
}: {
  label?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      {label ? (
        <div className="mb-2 text-xs font-semibold uppercase tracking-[3px] text-primary">
          {label}
        </div>
      ) : null}
      <h2 className="font-heading text-3xl font-bold italic sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}
