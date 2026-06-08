import type { CSSProperties } from "react";

/**
 * Tenant theme system — validation, defaults, and CSS-variable projection.
 *
 * COUNCIL FIX M7: a tenant's `theme` JSON is operator-supplied and ends up
 * injected as inline CSS custom properties on the storefront. We therefore
 * NEVER trust raw values: colors must be 6-digit hex, the font must be one of a
 * fixed allowlist, and the logo must be a relative path or an http(s) URL.
 * Anything else is rejected (on save) or silently dropped to the default (on
 * render) so a crafted value can't smuggle arbitrary tokens into the page.
 */

export interface TenantTheme {
  primary: string;
  secondary: string;
  font: string;
  /** Optional store logo — relative path ("/images/x.png") or https URL. */
  logoUrl: string | null;
}

/** Brand default — terracotta + cream, mirrors `globals.css` :root. */
export const DEFAULT_THEME: TenantTheme = {
  primary: "#c0563d",
  secondary: "#f0e6d3",
  font: "'DM Sans', sans-serif",
  logoUrl: null,
};

/** Allowed display fonts. The editor and validator share this single list. */
export const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: "'DM Sans', sans-serif", label: "DM Sans" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "Georgia, serif", label: "Georgia" },
];

const FONT_ALLOWLIST = new Set(FONT_OPTIONS.map((f) => f.value));

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** True for a valid 6-digit hex color (e.g. `#c0563d`). */
export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

/** True for an allowed logo reference: relative path or http(s) URL. */
export function isLogoUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  if (value.startsWith("/")) return !value.startsWith("//"); // relative path, not protocol-relative
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

interface ThemeInput {
  primary?: unknown;
  secondary?: unknown;
  font?: unknown;
  logoUrl?: unknown;
}

/**
 * STRICT: validate operator-supplied theme input, throwing a user-facing error
 * on the first invalid field. Use on SAVE (settings / tenant create+edit) so a
 * bad value is rejected loudly rather than silently corrected.
 */
export function assertValidTheme(input: ThemeInput): TenantTheme {
  const primary = String(input.primary ?? "").trim();
  const secondary = String(input.secondary ?? "").trim();
  const font = String(input.font ?? "").trim();
  const logoRaw = String(input.logoUrl ?? "").trim();

  if (!isHexColor(primary)) {
    throw new Error("Primary color must be a 6-digit hex value (e.g. #c0563d).");
  }
  if (!isHexColor(secondary)) {
    throw new Error("Secondary color must be a 6-digit hex value (e.g. #f0e6d3).");
  }
  if (!FONT_ALLOWLIST.has(font)) {
    throw new Error("Font must be one of the supported display fonts.");
  }
  if (logoRaw && !isLogoUrl(logoRaw)) {
    throw new Error("Logo must be a relative path (/…) or an http(s) URL.");
  }

  return { primary, secondary, font, logoUrl: logoRaw || null };
}

/**
 * LENIENT: project a stored theme JSON onto a complete `TenantTheme`, falling
 * back to the brand default for any missing or invalid field. Never throws —
 * use on RENDER (layouts) where a malformed value must degrade gracefully.
 */
export function resolveTheme(themeJson: unknown): TenantTheme {
  const t = (themeJson && typeof themeJson === "object" ? themeJson : {}) as ThemeInput;
  return {
    primary: isHexColor(t.primary) ? (t.primary as string) : DEFAULT_THEME.primary,
    secondary: isHexColor(t.secondary)
      ? (t.secondary as string)
      : DEFAULT_THEME.secondary,
    font:
      typeof t.font === "string" && FONT_ALLOWLIST.has(t.font)
        ? t.font
        : DEFAULT_THEME.font,
    logoUrl: isLogoUrl(t.logoUrl) ? (t.logoUrl as string) : DEFAULT_THEME.logoUrl,
  };
}

/** Inline CSS custom properties injected by the storefront layout. */
export function themeToCssVars(theme: TenantTheme): CSSProperties {
  return {
    ["--tenant-primary" as string]: theme.primary,
    ["--tenant-secondary" as string]: theme.secondary,
    ["--tenant-font" as string]: theme.font,
  };
}
