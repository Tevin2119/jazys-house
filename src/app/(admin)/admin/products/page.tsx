export const dynamic = "force-dynamic";

import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { SearchInput } from "@/components/admin/filters";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { deleteProduct, restoreProduct } from "./actions";

function isAbsoluteUrl(value: string | undefined): value is string {
  return !!value && /^https?:\/\//i.test(value);
}

function StockStatusPill({ stock, deletedAt }: { stock: number; deletedAt: Date | null }) {
  if (deletedAt) {
    return (
      <span
        style={{
          background: "#f0e8da",
          color: "#8a7c6a",
          padding: "3px 10px",
          borderRadius: 999,
          fontSize: 11.5,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        Archived
      </span>
    );
  }
  if (stock === 0) {
    return (
      <span
        style={{
          background: "#f3dad4",
          color: "#a3442e",
          padding: "3px 10px",
          borderRadius: 999,
          fontSize: 11.5,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        Out of stock
      </span>
    );
  }
  if (stock <= 8) {
    return (
      <span
        style={{
          background: "#fbe5cf",
          color: "#9a6b1e",
          padding: "3px 10px",
          borderRadius: 999,
          fontSize: 11.5,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        Low stock
      </span>
    );
  }
  return (
    <span
      style={{
        background: "#d8ecd9",
        color: "#2f6b3a",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      In stock
    </span>
  );
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

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where: { tenantId, deletedAt: null } }),
  ]);

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 22,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Marcellus', serif",
              fontSize: 30,
              margin: "0 0 4px",
              fontWeight: 400,
            }}
          >
            Products
          </h1>
          <p style={{ fontSize: 14, color: "#6b5d4f", margin: 0 }}>
            {products.length} of {totalCount} products
          </p>
        </div>
        <Link
          href="/admin/products/new"
          style={{
            background: "#c0563d",
            color: "#fff",
            border: "none",
            borderRadius: 9,
            padding: "11px 20px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          + Add Product
        </Link>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 18 }}>
        <SearchInput placeholder="Search products…" />
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {products.length === 0 ? (
          <p
            style={{
              padding: "40px 0",
              textAlign: "center",
              color: "#8a7c6a",
              fontSize: 14,
            }}
          >
            No products found.
          </p>
        ) : (
          products.map((p) => {
            const thumb = p.images[0];
            return (
              <div
                key={p.id}
                style={{
                  background: "#fffdf9",
                  border: "1px solid #ece2d2",
                  borderRadius: 12,
                  padding: "11px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {isAbsoluteUrl(thumb) ? (
                  <Image
                    src={thumb}
                    alt={p.name}
                    width={42}
                    height={42}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 8,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 8,
                      background: "#e6dccb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {p.emoji ?? "📦"}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: "#2a1f16" }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b5d4f" }}>
                    {formatPrice(p.price)}
                  </div>
                </div>
                <StockStatusPill stock={p.stock} deletedAt={p.deletedAt} />
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div
        className="hidden md:block"
        style={{
          background: "#fffdf9",
          border: "1px solid #ece2d2",
          borderRadius: 13,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2.4fr 1fr 0.9fr 1.1fr 0.7fr",
            padding: "13px 22px",
            fontSize: 11,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#a39685",
            fontWeight: 700,
            borderBottom: "1px solid #f0e8da",
          }}
        >
          <span>Product</span>
          <span>Category</span>
          <span>Price</span>
          <span>Status</span>
          <span />
        </div>

        {products.length === 0 ? (
          <div
            style={{
              padding: "40px 22px",
              textAlign: "center",
              color: "#8a7c6a",
              fontSize: 14,
            }}
          >
            No products found.
          </div>
        ) : (
          products.map((p) => {
            const thumb = p.images[0];
            return (
              <div
                key={p.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.4fr 1fr 0.9fr 1.1fr 0.7fr",
                  padding: "12px 22px",
                  fontSize: 14,
                  alignItems: "center",
                  borderBottom: "1px solid #f4ecde",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {isAbsoluteUrl(thumb) ? (
                    <Image
                      src={thumb}
                      alt={p.name}
                      width={42}
                      height={42}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 8,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 8,
                        background: "#e6dccb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {p.emoji ?? "📦"}
                    </div>
                  )}
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                </div>
                <span style={{ color: "#6b5d4f", textTransform: "capitalize" }}>
                  {p.category?.name ?? "—"}
                </span>
                <span style={{ fontWeight: 700 }}>{formatPrice(p.price)}</span>
                <span>
                  <StockStatusPill stock={p.stock} deletedAt={p.deletedAt} />
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    style={{
                      color: "#c0563d",
                      fontWeight: 700,
                      fontSize: 13,
                      textDecoration: "none",
                    }}
                  >
                    Edit
                  </Link>
                  {p.deletedAt ? (
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
