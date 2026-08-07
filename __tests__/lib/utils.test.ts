import { describe, expect, it } from "vitest";
import { currencyDivisor, formatPrice, toMinorUnits } from "@/lib/utils";

describe("currency conversion", () => {
  it("preserves zero-decimal XOF and JPY amounts", () => {
    expect(currencyDivisor("xof")).toBe(1);
    expect(toMinorUnits(1_000, "xof")).toBe(1_000);
    expect(toMinorUnits(1_000, "jpy")).toBe(1_000);
  });

  it("uses minor units for two-decimal currencies", () => {
    expect(currencyDivisor("gbp")).toBe(100);
    expect(toMinorUnits(12.34, "gbp")).toBe(1_234);
    expect(formatPrice(1_234, "gbp", "en-GB")).toContain("12.34");
  });
});
