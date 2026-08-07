export const dynamic = "force-dynamic";

import type { ReactElement } from "react";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "../actions";

export default async function NewProductPage(): Promise<ReactElement> {
  const { tenantId } = await getAdminContext();
  const [categories, tenant] = await Promise.all([
    prisma.category.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { currency: true } }),
  ]);

  return (
    <div>
      <PageHeader title="New product" />
      <ProductForm action={createProduct} categories={categories} currency={tenant.currency} />
    </div>
  );
}
