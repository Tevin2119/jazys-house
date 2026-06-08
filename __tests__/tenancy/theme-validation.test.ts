import { describe, it, expect } from "vitest";
import {
  isHexColor,
  isLogoUrl,
  assertValidTheme,
  resolveTheme,
  DEFAULT_THEME,
} from "../../src/lib/theme";

/**
 * Theme validation/hardening (Phase 5c / Thinker finding M7).
 * Run: `npx vitest run`.
 */
describe("isHexColor", () => {
  it("accepts 6-digit hex", () => {
    expect(isHexColor("#c0563d")).toBe(true);
    expect(isHexColor("#FFFFFF")).toBe(true);
  });
  it("rejects shorthand, names, and arbitrary tokens", () => {
    expect(isHexColor("#fff")).toBe(false);
    expect(isHexColor("red")).toBe(false);
    expect(isHexColor("expression(alert(1))")).toBe(false);
    expect(isHexColor(123)).toBe(false);
  });
});

describe("isLogoUrl", () => {
  it("accepts relative paths and http(s) URLs", () => {
    expect(isLogoUrl("/images/logo.png")).toBe(true);
    expect(isLogoUrl("https://cdn.example.com/a.png")).toBe(true);
  });
  it("rejects protocol-relative and dangerous schemes", () => {
    expect(isLogoUrl("//evil.com/x.png")).toBe(false);
    expect(isLogoUrl("javascript:alert(1)")).toBe(false);
    expect(isLogoUrl("")).toBe(false);
  });
});

describe("assertValidTheme", () => {
  it("returns a normalized theme for valid input", () => {
    expect(
      assertValidTheme({
        primary: "#1f5132",
        secondary: "#efe3c2",
        font: "'Playfair Display', serif",
        logoUrl: "/images/logo.png",
      }),
    ).toEqual({
      primary: "#1f5132",
      secondary: "#efe3c2",
      font: "'Playfair Display', serif",
      logoUrl: "/images/logo.png",
    });
  });

  it("throws on a non-hex color", () => {
    expect(() =>
      assertValidTheme({ primary: "red", secondary: "#fff000", font: "'Inter', sans-serif" }),
    ).toThrow();
  });

  it("throws on a font outside the allowlist", () => {
    expect(() =>
      assertValidTheme({ primary: "#000000", secondary: "#ffffff", font: "Comic Sans" }),
    ).toThrow();
  });
});

describe("resolveTheme", () => {
  it("falls back to the default for null/invalid input", () => {
    expect(resolveTheme(null)).toEqual(DEFAULT_THEME);
    expect(resolveTheme({ primary: "nonsense" }).primary).toBe(DEFAULT_THEME.primary);
  });

  it("keeps valid fields and defaults the rest", () => {
    const t = resolveTheme({ primary: "#123456" });
    expect(t.primary).toBe("#123456");
    expect(t.secondary).toBe(DEFAULT_THEME.secondary);
  });
});
