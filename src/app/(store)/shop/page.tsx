import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentTenant } from "@/lib/tenant";
import { getCatalog, getCategories } from "@/lib/storefront";
import { ProductCard } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section";
import { NoStore } from "@/components/store/no-store";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop — African Handmade Fashion & Superfoods",
  description:
    "Shop African handmade fashion & superfoods. Ankara, Kente, Dashiki for women, men & kids, plus hibiscus, moringa and baobab.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const tenant = await getCurrentTenant();
  if (!tenant) return <NoStore />;

  const { cat, q } = await searchParams;
  const activeCat = cat ?? "all";

  const [categories, products] = await Promise.all([
    getCategories(tenant.id),
    getCatalog({ tenantId: tenant.id, categorySlug: cat, q }),
  ]);

  const buildHref = (slug: string) => {
    const params = new URLSearchParams();
    if (slug !== "all") params.set("cat", slug);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  const tabs = [{ slug: "all", name: "All" }, ...categories];

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-16">
      <SectionHeading
        label="Our Collection"
        title="Handmade with Soul"
        subtitle="Every piece is crafted with authentic African fabrics — Ankara, Kente, Mudcloth, Dashiki. Made by hand, worn with pride."
      />

      {/* SEARCH */}
      <form action="/shop" className="mx-auto mt-8 flex max-w-md gap-2">
        {cat ? <input type="hidden" name="cat" value={cat} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search products…"
          className="flex-1 rounded-md border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--accent-hover)]"
        >
          Search
        </button>
      </form>

      {/* CATEGORY TABS */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {tabs.map((t) => (
          <Link
            key={t.slug}
            href={buildHref(t.slug)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              activeCat === t.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-secondary",
            )}
          >
            {t.name}
          </Link>
        ))}
      </div>

      {/* GRID */}
      {products.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              categoryName={p.category?.name}
              currency={tenant.currency}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <div className="text-5xl">🔍</div>
          <h3 className="mt-3 font-heading text-2xl font-bold italic">
            No products found
          </h3>
          <p className="mt-2 text-muted-foreground">
            {q
              ? `Nothing matched “${q}”. Try a different search or category.`
              : "There's nothing in this category yet."}
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
          >
            View all products
          </Link>
        </div>
      )}
    </div>
  );
}
