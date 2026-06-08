import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Tenant isolation invariants (Phase 5e).
 *
 * Two layers:
 *  1. STATIC guards (run now) — assert that the storefront data layer never
 *     exposes a query without a tenant scope. These are cheap source-level
 *     checks that catch the most common regression: a new `findMany` that
 *     forgets `tenantId`.
 *  2. INTEGRATION stubs (todo) — true cross-tenant read/write isolation needs a
 *     seeded test database. Marked `.todo` until a Postgres test harness exists.
 */

const root = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("storefront data layer is tenant-scoped (static)", () => {
  const storefront = read("src/lib/storefront.ts");

  it("every Prisma findMany/findFirst/findUnique passes tenantId", () => {
    // Each query block in storefront.ts must reference tenantId. We approximate
    // by requiring the count of `prisma.` query calls to be matched by tenantId
    // occurrences (every query is fenced).
    const queries = storefront.match(/prisma\.\w+\.(findMany|findFirst|findUnique)/g) ?? [];
    const tenantRefs = storefront.match(/tenantId/g) ?? [];
    expect(queries.length).toBeGreaterThan(0);
    expect(tenantRefs.length).toBeGreaterThanOrEqual(queries.length);
  });
});

describe("admin actions re-derive tenant scope from the session (static)", () => {
  it("settings action never trusts a client-supplied tenantId", () => {
    const actions = read("src/app/(admin)/admin/settings/actions.ts");
    expect(actions).toContain("getAdminContext");
    expect(actions).not.toMatch(/formData\.get\(["']tenantId["']\)/);
  });

  it("tenant CRUD is gated by requireSuperAdmin", () => {
    const actions = read("src/app/(admin)/admin/tenants/actions.ts");
    expect(actions).toContain("requireSuperAdmin");
  });
});

describe("cross-tenant DB isolation (integration)", () => {
  it.todo("a tenant admin cannot read another tenant's products");
  it.todo("a tenant admin cannot mutate another tenant's settings");
  it.todo("deleting a tenant with orders is blocked");
  it.todo("a storefront request only ever returns its own tenant's catalog");
});
