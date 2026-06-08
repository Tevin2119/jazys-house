export const dynamic = "force-dynamic";

import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { updateProduct } from "../../actions";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const { tenantId } = await getAdminContext();
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, tenantId },
  });
  if (!product) notFound();

  const categories = await prisma.category.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Edit product" />
      <ProductForm
        action={updateProduct}
        categories={categories}
        product={product}
      />
    </div>
  );
}
