import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentTenant } from "@/lib/tenant";
import { getProductBySlug, getRelatedProducts } from "@/lib/storefront";
import { formatPrice } from "@/lib/utils";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductBadge } from "@/components/store/product-badge";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { ProductCard } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section";
import { NoStore } from "@/components/store/no-store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { title: "Shop" };
  const { slug } = await params;
  const product = await getProductBySlug(tenant.id, slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} — ${tenant.name}`,
    description: product.description ?? `${product.name} from ${tenant.name}.`,
    openGraph: {
      title: product.name,
      images: product.images.length ? product.images : ["/images/logo.jpg"],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const tenant = await getCurrentTenant();
  if (!tenant) return <NoStore />;

  const { slug } = await params;
  const product = await getProductBySlug(tenant.id, slug);
  if (!product) notFound();

  const related = product.categoryId
    ? await getRelatedProducts(tenant.id, product.categoryId, product.id, 4)
    : [];

  const inStock = product.stock > 0;
  const firstImage = product.images[0] ?? null;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12">
      {/* BREADCRUMB */}
      <nav className="mb-8 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/shop" className="hover:text-foreground">
              Shop
            </Link>
          </li>
          {product.category ? (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={`/shop?cat=${product.category.slug}`}
                  className="hover:text-foreground"
                >
                  {product.category.name}
                </Link>
              </li>
            </>
          ) : null}
          <li aria-hidden>/</li>
          <li className="text-foreground">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery
          images={product.images}
          emoji={product.emoji}
          name={product.name}
        />

        <div>
          {product.badge ? (
            <div className="mb-3">
              <ProductBadge
                label={product.badge}
                badgeClass={product.badgeClass}
              />
            </div>
          ) : null}
          {product.category ? (
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {product.category.name}
            </span>
          ) : null}
          <h1 className="mt-1 font-heading text-4xl font-bold italic">
            {product.name}
          </h1>
          <div className="mt-4 text-3xl font-bold text-primary">
            {formatPrice(product.price, tenant.currency)}
          </div>

          <p
            className={cnStock(inStock)}
            aria-live="polite"
          >
            {inStock ? "● In stock" : "● Out of stock"}
          </p>

          {product.description ? (
            <p className="mt-6 leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          ) : null}

          <div className="mt-8 max-w-xs">
            {inStock ? (
              <AddToCartButton
                product={{
                  productId: product.id,
                  name: product.name,
                  price: product.price,
                  image: firstImage,
                  emoji: product.emoji,
                }}
              />
            ) : (
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-md bg-secondary px-4 py-2.5 text-sm font-semibold text-muted-foreground"
              >
                Out of stock
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RELATED */}
      {related.length > 0 ? (
        <section className="mt-20">
          <SectionHeading title="You May Also Like" />
          <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} currency={tenant.currency} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function cnStock(inStock: boolean): string {
  return inStock
    ? "mt-3 text-sm font-medium text-[var(--green)]"
    : "mt-3 text-sm font-medium text-destructive";
}
