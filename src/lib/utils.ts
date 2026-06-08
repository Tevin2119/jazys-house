import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional Tailwind class names, de-duplicating conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format an integer amount of minor units (pence) as a localized currency string.
 * Money is stored as Int everywhere; convert only at the display boundary.
 */
export function formatPrice(
  minorUnits: number,
  currency = "gbp",
  locale = "en-GB",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minorUnits / 100);
}

/** Convert a human-facing major-unit price (e.g. 85 or 85.5) to integer pence. */
export function toMinorUnits(majorUnits: number): number {
  return Math.round(majorUnits * 100);
}

/** URL-safe slug from arbitrary text. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics -> hyphen
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .replace(/-{2,}/g, "-"); // collapse repeats
}
