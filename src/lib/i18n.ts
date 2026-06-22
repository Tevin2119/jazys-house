// Lightweight bilingual utility (JA/EN) — no library dependency.
// L(ja, en, lang?) picks the right string. Defaults to 'ja' — Japan-first platform.

import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export type Lang = "ja" | "en";

export function L(ja: string, en: string, lang: Lang = "ja"): string {
  return lang === "ja" ? ja : en;
}

export function getLangFromHeader(acceptLanguage: string | null): Lang {
  if (!acceptLanguage) return "ja";
  const primary =
    acceptLanguage.split(",")[0]?.split(";")[0]?.trim().toLowerCase() ?? "";
  return primary.startsWith("en") ? "en" : "ja";
}

/** Read the current lang from a pre-resolved cookie store. Pass via: `await cookies()` */
export function getLangFromCookies(store: ReadonlyRequestCookies): Lang {
  const val = store.get("lang")?.value;
  return val === "en" ? "en" : "ja";
}

// ─── Dictionaries ──────────────────────────────────────────────────────────────

export const ORDER_STATUS_LABEL: Record<string, { ja: string; en: string }> = {
  PENDING:       { ja: "注文受付",     en: "Order Received" },
  PROCESSING:    { ja: "処理中",       en: "Processing" },
  LABEL_CREATED: { ja: "ラベル作成済", en: "Label Created" },
  SHIPPED:       { ja: "発送済み",     en: "Shipped" },
  IN_TRANSIT:    { ja: "配達中",       en: "In Transit" },
  DELIVERED:     { ja: "配達完了",     en: "Delivered" },
  CANCELLED:     { ja: "キャンセル",   en: "Cancelled" },
  REFUNDED:      { ja: "返金済み",     en: "Refunded" },
};

/** Statuses that form the forward delivery timeline (excludes terminal side-exits). */
export const TIMELINE_STATUSES = [
  "PENDING",
  "PROCESSING",
  "LABEL_CREATED",
  "SHIPPED",
  "IN_TRANSIT",
  "DELIVERED",
] as const;

export type TimelineStatus = (typeof TIMELINE_STATUSES)[number];

/** All 47 Japanese prefectures in JIS order. */
export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
] as const;

export type Prefecture = (typeof PREFECTURES)[number];

/** Format a Japanese address object for display. */
export function formatJapaneseAddress(addr: Record<string, unknown>): string {
  const parts: string[] = [];
  if (addr.postalCode) parts.push(`〒${String(addr.postalCode)}`);
  if (addr.prefecture) parts.push(String(addr.prefecture));
  if (addr.city) parts.push(String(addr.city));
  if (addr.line1) parts.push(String(addr.line1));
  if (addr.line2) parts.push(String(addr.line2));
  return parts.join(" ");
}

/** Format currency per locale (JPY = no decimals, others keep existing behaviour). */
export function formatPriceLocalized(
  minorUnits: number,
  currency: string,
  lang: Lang = "ja",
): string {
  const locale = lang === "ja" ? "ja-JP" : "en-GB";
  const major = currency.toLowerCase() === "jpy" ? minorUnits : minorUnits / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: currency.toLowerCase() === "jpy" ? 0 : 2,
  }).format(major);
}
