"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type QueryModel = "Product" | "Order" | "CateringInquiry" | "User" | "NewsletterSignup";
type QueryOperator = "equals" | "contains" | "gt" | "lt" | "gte" | "lte";
type FieldType = "string" | "number" | "date";

export interface QueryFilter {
  field: string;
  operator: QueryOperator;
  value: string;
}

export interface QueryConfig {
  model: QueryModel;
  fields: string[];
  filters: QueryFilter[];
  sort: { field: string; direction: "asc" | "desc" } | null;
}

interface ModelDefinition {
  fields: Record<string, FieldType>;
}

// This is the reporting contract. It is deliberately not inferred from Prisma:
// adding a database column cannot accidentally expose it through the UI.
const MODELS: Record<QueryModel, ModelDefinition> = {
  Product: { fields: { id: "string", name: "string", slug: "string", price: "number", stock: "number", badge: "string", createdAt: "date" } },
  Order: { fields: { id: "string", status: "string", total: "number", currency: "string", email: "string", name: "string", createdAt: "date" } },
  CateringInquiry: { fields: { id: "string", name: "string", email: "string", date: "string", guests: "number", package: "string", status: "string", createdAt: "date" } },
  User: { fields: { id: "string", name: "string", email: "string", role: "string", createdAt: "date" } },
  NewsletterSignup: { fields: { id: "string", email: "string", createdAt: "date" } },
};

const MAX_FILTERS = 5;
const MAX_VALUE_LENGTH = 120;

export async function getModelFields(model: QueryModel): Promise<string[]> {
  return model in MODELS ? Object.keys(MODELS[model].fields) : [];
}

function parseConfig(input: QueryConfig): QueryConfig {
  if (!input || !(input.model in MODELS) || !Array.isArray(input.fields) || !Array.isArray(input.filters)) {
    throw new Error("Invalid query configuration.");
  }
  const definition = MODELS[input.model];
  const validFields = new Set(Object.keys(definition.fields));
  if (input.fields.length === 0 || input.fields.length > validFields.size || input.fields.some((field) => !validFields.has(field))) {
    throw new Error("Select one or more supported report fields.");
  }
  if (input.filters.length > MAX_FILTERS) throw new Error("Too many filters.");
  for (const filter of input.filters) {
    const type = definition.fields[filter.field];
    if (!type || !["equals", "contains", "gt", "lt", "gte", "lte"].includes(filter.operator) ||
      typeof filter.value !== "string" || filter.value.length === 0 || filter.value.length > MAX_VALUE_LENGTH) {
      throw new Error("Invalid filter.");
    }
    if ((filter.operator === "contains" && type !== "string") ||
      (["gt", "lt", "gte", "lte"].includes(filter.operator) && type === "string")) {
      throw new Error("This filter is not supported for the selected field.");
    }
  }
  if (input.sort && (!validFields.has(input.sort.field) || !["asc", "desc"].includes(input.sort.direction))) {
    throw new Error("Invalid sort.");
  }
  return input;
}

function queryValue(type: FieldType, filter: QueryFilter): string | number | Date | { contains: string; mode: "insensitive" } {
  if (filter.operator === "contains") return { contains: filter.value, mode: "insensitive" };
  if (type === "number") {
    const value = Number(filter.value);
    if (!Number.isSafeInteger(value)) throw new Error("Numeric filters must be whole numbers.");
    return value;
  }
  if (type === "date") {
    const value = new Date(filter.value);
    if (Number.isNaN(value.getTime())) throw new Error("Invalid date filter.");
    return value;
  }
  return filter.value;
}

function buildWhere(config: QueryConfig, tenantId: string): Record<string, unknown> {
  const filters = config.filters.map((filter) => {
    const value = queryValue(MODELS[config.model].fields[filter.field], filter);
    return filter.operator === "equals" ? { [filter.field]: value } : { [filter.field]: { [filter.operator]: value } };
  });
  // Tenant scope is an immutable AND condition, never a client-controlled field.
  return { AND: [{ tenantId }, ...filters] };
}

function makeSelect(fields: string[]): Record<string, true> {
  return Object.fromEntries(fields.map((field) => [field, true]));
}

export async function runQuery(input: QueryConfig): Promise<Record<string, unknown>[]> {
  const { tenantId } = await getAdminContext();
  const config = parseConfig(input);
  const where = buildWhere(config, tenantId);
  const orderBy = config.sort ? { [config.sort.field]: config.sort.direction } : { createdAt: "desc" as const };
  const select = makeSelect(config.fields);

  switch (config.model) {
    case "Product":
      return prisma.product.findMany({ where: where as Prisma.ProductWhereInput, select, orderBy, take: 200 }) as Promise<Record<string, unknown>[]>;
    case "Order":
      return prisma.order.findMany({ where: where as Prisma.OrderWhereInput, select, orderBy, take: 200 }) as Promise<Record<string, unknown>[]>;
    case "CateringInquiry":
      return prisma.cateringInquiry.findMany({ where: where as Prisma.CateringInquiryWhereInput, select, orderBy, take: 200 }) as Promise<Record<string, unknown>[]>;
    case "User":
      return prisma.user.findMany({ where: where as Prisma.UserWhereInput, select, orderBy, take: 200 }) as Promise<Record<string, unknown>[]>;
    case "NewsletterSignup":
      return prisma.newsletterSignup.findMany({ where: where as Prisma.NewsletterSignupWhereInput, select, orderBy, take: 200 }) as Promise<Record<string, unknown>[]>;
  }
}

export async function saveQuery(name: string, input: QueryConfig): Promise<void> {
  const { tenantId, session } = await getAdminContext();
  const config = parseConfig(input);
  const normalizedName = name.trim();
  if (!normalizedName || normalizedName.length > 80) throw new Error("Query name must be between 1 and 80 characters.");
  await prisma.savedQuery.create({
    data: { tenantId, name: normalizedName, config: config as unknown as Prisma.InputJsonValue, createdBy: session.user.email ?? session.user.id },
  });
  revalidatePath("/admin/query-builder");
}

export async function getSavedQueries() {
  const { tenantId } = await getAdminContext();
  return prisma.savedQuery.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
}

export async function deleteSavedQuery(id: string): Promise<void> {
  const { tenantId } = await getAdminContext();
  await prisma.savedQuery.deleteMany({ where: { id, tenantId } });
  revalidatePath("/admin/query-builder");
}
