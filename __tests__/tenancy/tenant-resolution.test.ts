import { describe, it, expect } from "vitest";
import {
  normalizeHost,
  stripWww,
  subdomainFromHost,
} from "../../src/lib/host";

/**
 * Tenant resolution — host parsing (Phase 5a).
 * Run: `npx vitest run` (Vitest is the documented unit-test runner; add it with
 * `npm i -D vitest` if not yet installed).
 *
 * These assume the default root domain `localhost:3000`.
 */
describe("normalizeHost", () => {
  it("strips the port and lower-cases", () => {
    expect(normalizeHost("JazysHouse.LOCALHOST:3000")).toBe("jazyshouse.localhost");
  });
});

describe("stripWww", () => {
  it("removes a single leading www.", () => {
    expect(stripWww("www.jazyshouse.com")).toBe("jazyshouse.com");
  });
  it("leaves non-www hosts untouched", () => {
    expect(stripWww("jazyshouse.com")).toBe("jazyshouse.com");
  });
});

describe("subdomainFromHost", () => {
  it("extracts a subdomain slug under the root domain", () => {
    expect(subdomainFromHost("jazyshouse.localhost:3000")).toBe("jazyshouse");
  });

  it("is case-insensitive (lower-cases the slug)", () => {
    expect(subdomainFromHost("JazysHouse.localhost")).toBe("jazyshouse");
  });

  it("ignores the port", () => {
    expect(subdomainFromHost("afrochic.localhost:8080")).toBe("afrochic");
  });

  it("returns null for the bare root domain (apex → default tenant)", () => {
    expect(subdomainFromHost("localhost:3000")).toBeNull();
  });

  it("returns null for a 2-label custom domain (resolved by domain column)", () => {
    expect(subdomainFromHost("jazyshouse.com")).toBeNull();
  });

  it("treats the leading label of a 3+ label custom host as the subdomain", () => {
    expect(subdomainFromHost("baobab.example.com")).toBe("baobab");
  });

  it("strips www. before extracting (apex with www → null)", () => {
    expect(subdomainFromHost("www.localhost:3000")).toBeNull();
  });
});
