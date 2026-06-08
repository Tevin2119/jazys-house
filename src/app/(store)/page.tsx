import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getCurrentTenant } from "@/lib/tenant";
import { getCatalog, getFeaturedProducts } from "@/lib/storefront";
import { CATERING_PACKAGES } from "@/lib/catering-packages";
import { ProductCard } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section";
import { NoStore } from "@/components/store/no-store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant();
  const name = tenant?.name ?? "Jazy's House";
  return {
    title: `${name} — African Handmade Fashion, Superfoods & Catering`,
    description:
      "African handmade clothing & accessories, pure African superfoods, and authentic African catering. Worn with pride, made with love.",
    openGraph: { title: name, images: ["/images/logo.jpg"] },
  };
}

const BENEFITS = [
  { icon: "🌍", title: "Ships Worldwide", text: "International shipping available" },
  { icon: "🤲", title: "Handmade", text: "Every piece crafted with care" },
  { icon: "🇸🇳", title: "Authentic", text: "African fabrics, African soul" },
  { icon: "💬", title: "Personal Service", text: "Real people, real care" },
];

const LOOKBOOK = [
  { src: "/images/dress-navy-orange.jpg", alt: "Ankara Maxi Dress" },
  { src: "/images/suit-maroon-gold.jpg", alt: "Maroon Gold Suit" },
  { src: "/images/mens-colorful-shirt.jpg", alt: "Kente Print Shirt" },
  { src: "/images/dashiki-casual.jpg", alt: "Dashiki Style" },
  { src: "/images/jacket-yellow-blue.jpg", alt: "Bomber Jacket" },
  { src: "/images/dress-baskets.jpg", alt: "Handwoven Accessories" },
  { src: "/images/phone-charms-set.jpg", alt: "Beaded Phone Charms" },
  { src: "/images/dress-red-pattern.jpg", alt: "Bogolan Dress" },
];

export default async function StoreHomePage() {
  const tenant = await getCurrentTenant();
  if (!tenant) return <NoStore />;

  const [featured, pantry] = await Promise.all([
    getFeaturedProducts(tenant.id, 4),
    getCatalog({ tenantId: tenant.id, categorySlug: "pantry" }),
  ]);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[var(--warm)]">
        <div className="mx-auto grid max-w-[1400px] items-center gap-8 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <div className="mb-4 inline-block rounded-full bg-card px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground shadow-sm">
              African Fashion &amp; Healthy Good Food · Worldwide Delivery
            </div>
            <h1 className="font-heading text-5xl font-extrabold italic leading-[1.05] sm:text-6xl">
              African Fashion
              <br />
              <span className="text-primary">Handmade with Soul</span>
            </h1>
            <p className="mt-5 max-w-lg text-muted-foreground">
              {tenant.name} — your home for African handmade fashion, pure
              African superfoods &amp; authentic African catering. Vibrant
              Ankara, Kente, Dashiki. Worn with pride, made with love.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--accent-hover)]"
              >
                Shop Fashion
              </Link>
              <Link
                href="/shop?cat=pantry"
                className="rounded-md bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-[#2c1810] transition-opacity hover:opacity-90"
              >
                Shop Superfoods
              </Link>
              <Link
                href="/catering"
                className="rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
              >
                Book Catering
              </Link>
            </div>
          </div>
          <div className="hidden items-center justify-center text-[12rem] md:flex">
            🌍
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-[1400px] gap-6 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="text-center">
              <div className="text-3xl">{b.icon}</div>
              <h4 className="mt-2 font-semibold">{b.title}</h4>
              <p className="text-sm text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-[1400px] px-6 py-20">
        <SectionHeading
          label="Featured Collection"
          title="Handpicked for You"
          subtitle="Our bestselling pieces — each one handmade with authentic African fabrics and love."
        />
        {featured.length > 0 ? (
          <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} currency={tenant.currency} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-center text-muted-foreground">
            New pieces are on their way.
          </p>
        )}
        <div className="mt-12 text-center">
          <Link
            href="/shop"
            className="rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
          >
            View Full Collection →
          </Link>
        </div>
      </section>

      {/* CATERING TEASER */}
      <section className="bg-[var(--warm)]">
        <div className="mx-auto max-w-[1400px] px-6 py-20">
          <SectionHeading
            label="Catering"
            title="The Taste of Home"
            subtitle="Jollof rice, suya, braai, puff-puff… bring authentic African flavors to your next gathering."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {CATERING_PACKAGES.slice(0, 3).map((c) => (
              <div
                key={c.value}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <div className="flex h-40 items-center justify-center bg-secondary/50 text-6xl">
                  {c.emoji}
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-lg font-bold italic">
                    {c.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
                  <div className="mt-3 font-semibold text-primary">{c.price}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/catering"
              className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--accent-hover)]"
            >
              Explore Catering →
            </Link>
          </div>
        </div>
      </section>

      {/* PANTRY HIGHLIGHT */}
      {pantry.length > 0 ? (
        <section className="mx-auto max-w-[1400px] px-6 py-20">
          <SectionHeading
            label="Pantry"
            title="African Superfoods"
            subtitle="100% pure, natural African superfoods — dried hibiscus, organic moringa, baobab powder, straight from the source."
          />
          <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {pantry.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                categoryName={p.category?.name}
                currency={tenant.currency}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* LOOKBOOK */}
      <section className="bg-[var(--warm)]">
        <div className="mx-auto max-w-[1400px] px-6 py-20">
          <SectionHeading
            label="Lookbook"
            title="African Fashion, Alive"
            subtitle="Real people. Real style. See how the collection looks in the wild."
          />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {LOOKBOOK.map((img) => (
              <div
                key={img.src}
                className="relative aspect-[3/4] overflow-hidden rounded-lg"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
