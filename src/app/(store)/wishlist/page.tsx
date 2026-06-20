import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";
import { ProductCard } from "@/components/store/product-card";
import { NoStore } from "@/components/store/no-store";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenant = await getCurrentTenant();
  if (!tenant) return <NoStore />;

  const items = await prisma.wishlistItem.findMany({
    where: { tenantId: tenant.id, userId: session.user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  const activeItems = items.filter((i) => !i.product.deletedAt);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-12">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/account" className="hover:text-foreground">
          My Account
        </Link>
        {" / "}
        <span className="text-foreground">Wishlist</span>
      </nav>

      <h1 className="font-heading text-4xl font-bold italic">My Wishlist</h1>

      {activeItems.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-lg text-muted-foreground">Your wishlist is empty.</p>
          <Link
            href="/shop"
            className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4">
          {activeItems.map(({ product }) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={tenant.currency}
              tenantId={tenant.id}
              tenantName={tenant.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
