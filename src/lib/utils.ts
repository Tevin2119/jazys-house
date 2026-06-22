import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional Tailwind class names, de-duplicating conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Currencies that have no subunit — stored and displayed as whole units.
const ZERO_DECIMAL_CURRENCIES = new Set(["jpy", "krw", "vnd"]);

/**
 * Format an integer amount of minor units as a localized currency string.
 * Money is stored as Int everywhere; convert only at the display boundary.
 * Zero-decimal currencies (JPY, KRW, VND) are stored as whole units and
 * must not be divided.
 */
export function formatPrice(
  minorUnits: number,
  currency = "gbp",
  locale = "en-GB",
): string {
  const divisor = ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase()) ? 1 : 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(minorUnits / divisor);
}

/**
 * Convert a human-facing major-unit price to integer minor units.
 * Zero-decimal currencies (JPY, KRW, VND) are already whole units.
 */
export function toMinorUnits(majorUnits: number, currency = "gbp"): number {
  if (ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase())) {
    return Math.round(majorUnits);
  }
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
