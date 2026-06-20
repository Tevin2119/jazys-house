"use server";

import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

export type QueryModel = "Product" | "Order" | "CateringInquiry" | "User" | "NewsletterSignup";

export interface QueryFilter {
  field: string;
  operator: "equals" | "contains" | "gt" | "lt" | "gte" | "lte";
  value: string;
}

export interface QueryConfig {
  model: QueryModel;
  fields: string[];
  filters: QueryFilter[];
  sort: { field: string; direction: "asc" | "desc" } | null;
}

// Field definitions per model
const MODEL_FIELDS: Record<QueryModel, string[]> = {
  Product: ["id", "name", "slug", "price", "stock", "badge", "createdAt"],
  Order: ["id", "status", "total", "currency", "email", "name", "createdAt"],
  CateringInquiry: ["id", "name", "email", "date", "guests", "package", "status", "createdAt"],
  User: ["id", "name", "email", "role", "createdAt"],
  NewsletterSignup: ["id", "email", "createdAt"],
};

export async function getModelFields(model: QueryModel): Promise<string[]> {
  return MODEL_FIELDS[model] ?? [];
}

export async function runQuery(config: QueryConfig): Promise<Record<string, unknown>[]> {
  const { tenantId } = await getAdminContext();

  // Build where clause
  const where: Record<string, unknown> = { tenantId };
  for (const f of config.filters) {
    if (!f.field || !f.value) continue;
    switch (f.operator) {
      case "equals":
        where[f.field] = f.value;
        break;
      case "contains":
        where[f.field] = { contains: f.value, mode: "insensitive" };
        break;
      case "gt":
        where[f.field] = { gt: Number(f.value) };
        break;
      case "lt":
        where[f.field] = { lt: Number(f.value) };
        break;
      case "gte":
        where[f.field] = { gte: Number(f.value) };
        break;
      case "lte":
        where[f.field] = { lte: Number(f.value) };
        break;
    }
  }

  const orderBy = config.sort
    ? { [config.sort.field]: config.sort.direction }
    : { createdAt: "desc" as const };

  // Execute query based on model
  let rows: Record<string, unknown>[] = [];
  switch (config.model) {
    case "Product":
      rows = (await prisma.product.findMany({ where, orderBy, take: 200 })) as Record<string, unknown>[];
      break;
    case "Order":
      rows = (await prisma.order.findMany({ where, orderBy, take: 200 })) as Record<string, unknown>[];
      break;
    case "CateringInquiry":
      rows = (await prisma.cateringInquiry.findMany({ where, orderBy, take: 200 })) as Record<string, unknown>[];
      break;
    case "User":
      // Users: only the tenant's users (non-super-admin context)
      rows = (await prisma.user.findMany({
        where: { tenantId },
        orderBy,
        take: 200,
      })) as Record<string, unknown>[];
      break;
    case "NewsletterSignup":
      rows = (await prisma.newsletterSignup.findMany({ where, orderBy, take: 200 })) as Record<string, unknown>[];
      break;
  }

  // Project only selected fields
  if (config.fields.length > 0) {
    return rows.map((row) => {
      const projected: Record<string, unknown> = {};
      for (const f of config.fields) {
        projected[f] = row[f];
      }
      return projected;
    });
  }
  return rows;
}

export async function saveQuery(name: string, config: QueryConfig): Promise<void> {
  const { tenantId, session } = await getAdminContext();

  await prisma.savedQuery.create({
    data: {
      tenantId,
      name,
      config: config as unknown as Prisma.InputJsonValue,
      createdBy: session.user.email ?? "",
    },
  });
  revalidatePath("/admin/query-builder");
}

export async function getSavedQueries() {
  const { tenantId } = await getAdminContext();
  return prisma.savedQuery.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteSavedQuery(id: string): Promise<void> {
  const { tenantId } = await getAdminContext();
  await prisma.savedQuery.deleteMany({ where: { id, tenantId } });
  revalidatePath("/admin/query-builder");
}
