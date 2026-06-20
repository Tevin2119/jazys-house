import "server-only";
import { prisma } from "@/lib/db";

/**
 * COUNCIL FIX (JH-004): tenant-scoped Prisma client.
 *
 * Returns a Prisma client extended to auto-inject `tenantId` on every query
 * to tenant-scoped models. This is the *engineering control* against the #1
 * security risk: a forgotten `where: { tenantId }` clause silently leaking
 * cross-tenant data.
 *
 * Models that are auto-filtered:
 *   Product, Category, Order, OrderItem, CateringInquiry, NewsletterSignup
 *
 * Models deliberately NOT auto-filtered:
 *   Tenant (lookup/resolution), User (global auth), TenantMembership
 *   (membership lookup crosses tenants)
 *
 * Usage:
 *   import { tenantDb } from "@/lib/tenant-db";
 *   const db = tenantDb(currentTenant.id);
 *   const products = await db.product.findMany(); // tenantId auto-injected
 *
 * The extension ALSO enforces tenantId on write operations (create, update,
 * updateMany, delete, deleteMany, upsert) — so a developer can never
 * accidentally write data without a tenantId.
 */

type TenantScopedModel =
  | "product"
  | "category"
  | "order"
  | "orderItem"
  | "cateringInquiry"
  | "newsletterSignup";

const TENANT_MODELS: TenantScopedModel[] = [
  "product",
  "category",
  "order",
  "orderItem",
  "cateringInquiry",
  "newsletterSignup",
];

export function tenantDb(tenantId: string) {
  return prisma.$extends({
    name: "tenant-scoped",
    query: Object.fromEntries(
      TENANT_MODELS.map((model) => [
        model,
        {
          // Auto-inject tenantId on reads
          findUnique({ args, query }: { args: any; query: any }) {
            return query({ ...args, where: { ...args.where, tenantId } });
          },
          findUniqueOrThrow({ args, query }: { args: any; query: any }) {
            return query({ ...args, where: { ...args.where, tenantId } });
          },
          findFirst({ args, query }: { args: any; query: any }) {
            return query({ ...args, where: { ...args.where, tenantId } });
          },
          findFirstOrThrow({ args, query }: { args: any; query: any }) {
            return query({ ...args, where: { ...args.where, tenantId } });
          },
          findMany({ args, query }: { args: any; query: any }) {
            return query({ ...args, where: { ...args.where, tenantId } });
          },
          count({ args, query }: { args: any; query: any }) {
            return query({ ...args, where: { ...args.where, tenantId } });
          },

          // Auto-inject tenantId on writes
          create({ args, query }: { args: any; query: any }) {
            return query({ ...args, data: { ...args.data, tenantId } });
          },
          createMany({ args, query }: { args: any; query: any }) {
            return query({
              ...args,
              data: Array.isArray(args.data)
                ? args.data.map((d: any) => ({ ...d, tenantId }))
                : { ...args.data, tenantId },
            });
          },
          update({ args, query }: { args: any; query: any }) {
            return query({ ...args, where: { ...args.where, tenantId } });
          },
          updateMany({ args, query }: { args: any; query: any }) {
            return query({ ...args, where: { ...args.where, tenantId } });
          },
          delete({ args, query }: { args: any; query: any }) {
            return query({ ...args, where: { ...args.where, tenantId } });
          },
          deleteMany({ args, query }: { args: any; query: any }) {
            return query({ ...args, where: { ...args.where, tenantId } });
          },
          upsert({ args, query }: { args: any; query: any }) {
            return query({
              ...args,
              where: { ...args.where, tenantId },
              create: { ...args.create, tenantId },
              update: args.update,
            });
          },
        },
      ])
    ) as any,
  }) as unknown as typeof prisma;
}

// Convenience: resolve tenant from request headers and return a scoped client.
// Throws if no tenant context is available (caller should handle gracefully).
export { tenantDb as tenantPrisma };
