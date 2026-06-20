import Link from "next/link";
import type { Product } from "@prisma/client";
import { formatPrice } from "@/lib/utils";
import { ProductImage } from "@/components/store/product-image";
import { ProductBadge } from "@/components/store/product-badge";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { ProductViewTracker } from "@/components/analytics/product-view-tracker";
import { WishlistButton } from "@/components/store/wishlist-button";

/**
 * Catalog product card. The card body links to the product detail page; the
 * add-to-cart action is an isolated Client Component so the card itself stays a
 * Server Component (no Prisma or client JS leaks into the grid).
 */
export function ProductCard({
  product,
  categoryName,
  currency,
  tenantId,
  tenantName,
}: {
  product: Product;
  categoryName?: string | null;
  currency: string;
  tenantId?: string;
  tenantName?: string;
}) {
  const image = product.images[0] ?? null;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-[var(--shadow-lg,0_12px_40px_rgba(44,24,16,0.1))]">
      <ProductViewTracker
        productId={product.id}
        name={product.name}
        category={categoryName}
        price={product.price}
        currency={currency}
        tenantId={tenantId}
        tenantName={tenantName}
      />
      <div className="relative">
        <Link href={`/shop/${product.slug}`} className="block">
          <ProductImage
            image={image}
            emoji={product.emoji}
            alt={product.name}
            className="aspect-[3/4] w-full transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>
        {product.badge ? (
          <div className="absolute left-3 top-3">
            <ProductBadge label={product.badge} badgeClass={product.badgeClass} />
          </div>
        ) : null}
        <WishlistButton productId={product.id} />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {categoryName ? (
          <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">
            {categoryName}
          </span>
        ) : null}
        <Link href={`/shop/${product.slug}`}>
          <h3 className="line-clamp-2 font-medium leading-snug hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1 text-lg font-bold text-primary">
          {formatPrice(product.price, currency)}
        </div>
        <div className="mt-auto pt-3">
          <AddToCartButton
            product={{
              productId: product.id,
              name: product.name,
              price: product.price,
              image,
              emoji: product.emoji,
            }}
            currency={currency}
          />
        </div>
      </div>
    </div>
  );
}
