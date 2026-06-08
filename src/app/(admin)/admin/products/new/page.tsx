export const dynamic = "force-dynamic";

import type { ReactElement } from "react";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "../actions";

export default async function NewProductPage(): Promise<ReactElement> {
  const { tenantId } = await getAdminContext();
  const categories = await prisma.category.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="New product" />
      <ProductForm action={createProduct} categories={categories} />
    </div>
  );
}
