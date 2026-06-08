export const dynamic = "force-dynamic";

import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { SearchInput, SelectFilter } from "@/components/admin/filters";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteProduct, restoreProduct } from "./actions";

/** True when a string looks like an absolute http(s) image URL. */
function isAbsoluteUrl(value: string | undefined): value is string {
  return !!value && /^https?:\/\//i.test(value);
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; status?: string }>;
}): Promise<ReactElement> {
  const { tenantId } = await getAdminContext();
  const { q, cat, status = "active" } = await searchParams;

  const where: Prisma.ProductWhereInput = { tenantId };
  if (status === "active") where.deletedAt = null;
  else if (status === "deleted") where.deletedAt = { not: null };
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (cat && cat !== "all") where.categoryId = cat;

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Products"
        action={
          <Button asChild>
            <Link href="/admin/products/new">New product</Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search products…" />
        <SelectFilter
          paramKey="cat"
          placeholder="All categories"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <SelectFilter
          paramKey="status"
          placeholder="All statuses"
          options={[
            { value: "active", label: "Active" },
            { value: "deleted", label: "Deleted" },
          ]}
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Badge</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => {
                const thumb = p.images[0];
                const isDeleted = p.deletedAt !== null;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {isAbsoluteUrl(thumb) ? (
                          <Image
                            src={thumb}
                            alt={p.name}
                            width={40}
                            height={40}
                            className="size-10 rounded object-cover"
                          />
                        ) : (
                          <span className="flex size-10 items-center justify-center rounded bg-muted text-xl">
                            {p.emoji ?? "📦"}
                          </span>
                        )}
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{p.category?.name ?? "—"}</TableCell>
                    <TableCell>{formatPrice(p.price)}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>
                      {p.badge ? (
                        <Badge variant="secondary">{p.badge}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {isDeleted ? (
                        <Badge variant="outline">Deleted</Badge>
                      ) : (
                        <Badge>Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/products/${p.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                        {isDeleted ? (
                          <form action={restoreProduct}>
                            <input type="hidden" name="id" value={p.id} />
                            <ConfirmSubmitButton
                              variant="ghost"
                              size="sm"
                              confirmText="Restore this product?"
                            >
                              Restore
                            </ConfirmSubmitButton>
                          </form>
                        ) : (
                          <form action={deleteProduct}>
                            <input type="hidden" name="id" value={p.id} />
                            <ConfirmSubmitButton
                              variant="ghost"
                              size="sm"
                              confirmText="Soft-delete this product?"
                            >
                              Delete
                            </ConfirmSubmitButton>
                          </form>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
