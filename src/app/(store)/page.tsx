import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getCurrentTenant } from "@/lib/tenant";
import { getCatalog, getFeaturedProducts } from "@/lib/storefront";
import { ProductCard } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section";
import { NoStore } from "@/components/store/no-store";
import { NewsletterForm } from "@/components/store/newsletter-form";

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
      {/* MOBILE HERO — full-width image with dark gradient overlay */}
      <section className="relative md:hidden" style={{ minHeight: "340px" }}>
        <div className="absolute inset-0">
          {featured[0]?.images?.[0] ? (
            <Image
              src={featured[0].images[0].startsWith("/") ? featured[0].images[0] : `/${featured[0].images[0]}`}
              alt={featured[0].name}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          ) : (
            <Image
              src="/images/dress-navy-orange.jpg"
              alt="African fashion"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          )}
        </div>
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(42,31,22,0.88) 40%, rgba(42,31,22,0.15) 100%)" }}
        />
        <div className="relative flex flex-col justify-end px-6 pb-10" style={{ minHeight: "340px" }}>
          <h1
            className="font-heading font-normal leading-tight text-white"
            style={{ fontSize: "clamp(32px,9vw,40px)" }}
          >
            African Fashion
            <br />
            Handmade with Soul
          </h1>
          <div className="mt-5 flex gap-3">
            <Link
              href="/shop"
              className="rounded-full px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#a3442e]"
              style={{ background: "#c0563d" }}
            >
              Shop Now
            </Link>
            <Link
              href="/catering"
              className="rounded-full border-2 border-white px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              Catering
            </Link>
          </div>
        </div>
      </section>

      {/* HERO — desktop */}
      <section className="hidden overflow-hidden bg-[#f6efe4] md:block">
        <div className="mx-auto grid max-w-[1400px] items-center gap-0 md:grid-cols-2">
          {/* Left: text */}
          <div className="px-8 py-16 md:px-12 md:py-24 lg:px-16">
            <p
              className="mb-4 text-[11px] font-bold uppercase tracking-[2.5px]"
              style={{ color: "#a3442e" }}
            >
              Handmade in small batches · Est. 2025
            </p>
            <h1
              className="font-heading leading-[1.08]"
              style={{ fontSize: "clamp(40px,5vw,62px)", fontWeight: 400, color: "#2a1f16" }}
            >
              African Fashion
              <br />
              Handmade with Soul
            </h1>
            <p className="mt-5 max-w-lg text-[15px]" style={{ color: "#6b5d4f" }}>
              {tenant.name} — your home for African handmade fashion, pure
              African superfoods &amp; authentic African catering. Vibrant
              Ankara, Kente, Dashiki. Worn with pride, made with love.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="rounded-full px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#a3442e]"
                style={{ background: "#c0563d" }}
              >
                Shop the Collection
              </Link>
              <Link
                href="/catering"
                className="rounded-full border-[1.5px] px-6 py-3.5 text-sm font-bold transition-colors hover:bg-[#f0e8da]"
                style={{ borderColor: "#2a1f16", color: "#2a1f16" }}
              >
                Book Catering
              </Link>
            </div>
          </div>

          {/* Right: product image with floating overlay card */}
          <div className="relative hidden md:block" style={{ minHeight: "520px" }}>
            {featured[0]?.images?.[0] ? (
              <Image
                src={featured[0].images[0].startsWith("/") ? featured[0].images[0] : `/${featured[0].images[0]}`}
                alt={featured[0].name}
                fill
                sizes="50vw"
                className="object-cover"
                priority
              />
            ) : (
              <Image
                src="/images/dress-navy-orange.jpg"
                alt="African fashion"
                fill
                sizes="50vw"
                className="object-cover"
                priority
              />
            )}
            {/* Floating overlay card */}
            <div
              className="absolute bottom-8 left-8 rounded-xl px-5 py-4"
              style={{
                background: "rgba(255,253,249,0.95)",
                boxShadow: "0 18px 44px rgba(42,31,22,0.20)",
              }}
            >
              <p
                className="font-heading text-3xl font-normal leading-none"
                style={{ color: "#c0563d" }}
              >
                100%
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider" style={{ color: "#6b5d4f" }}>
                Handmade &amp; Authentic
              </p>
            </div>
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
              <ProductCard key={p.id} product={p} currency={tenant.currency} tenantId={tenant.id} tenantName={tenant.name} />
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

      {/* MOBILE CATERING PROMO */}
      <section className="mx-6 my-10 overflow-hidden rounded-2xl md:hidden">
        <div className="relative" style={{ minHeight: "200px" }}>
          <Image
            src="/images/chef-dienaba.jpg"
            alt="Chef preparing authentic African food"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(192,86,61,0.92) 100%)" }}
          />
        </div>
        <div className="px-6 pb-7 pt-5" style={{ background: "#c0563d" }}>
          <h3
            className="font-heading font-normal leading-tight text-white"
            style={{ fontSize: "clamp(24px,6vw,30px)" }}
          >
            The Taste of Home
          </h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
            Jollof rice, suya, puff-puff — authentic African catering for your next event.
          </p>
          <div className="mt-5">
            <Link
              href="/catering"
              className="inline-block rounded-full border-2 border-white px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#c0563d]"
            >
              Explore Catering →
            </Link>
          </div>
        </div>
      </section>

      {/* CATERING TEASER — full-bleed 2-col, desktop only */}
      <section className="hidden md:grid md:grid-cols-2" style={{ minHeight: "440px" }}>
        {/* Left: text panel on terracotta */}
        <div
          className="flex flex-col justify-center px-10 py-16 md:px-14 lg:px-20"
          style={{ background: "#c0563d" }}
        >
          <p
            className="mb-3 text-[11px] font-bold uppercase tracking-[2.5px]"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Catering
          </p>
          <h2
            className="font-heading leading-[1.1] text-white"
            style={{ fontSize: "clamp(32px,3.5vw,44px)", fontWeight: 400 }}
          >
            The Taste of Home
          </h2>
          <p className="mt-4 max-w-sm text-[15px]" style={{ color: "rgba(255,255,255,0.85)" }}>
            Jollof rice, suya, braai, puff-puff — bring authentic African
            flavors to your next gathering.
          </p>
          <div className="mt-8">
            <Link
              href="/catering"
              className="inline-block rounded-full border-2 border-white px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#c0563d]"
            >
              Explore Catering →
            </Link>
          </div>
        </div>

        {/* Right: chef image */}
        <div className="relative" style={{ minHeight: "440px" }}>
          <Image
            src="/images/chef-dienaba.jpg"
            alt="Chef preparing authentic African food"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
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
                tenantId={tenant.id}
                tenantName={tenant.name}
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

      {/* NEWSLETTER */}
      <section className="py-20" style={{ background: "#2a1f16" }}>
        <div className="mx-auto max-w-xl px-6 text-center">
          <h2 className="font-heading text-3xl font-normal text-white">
            Join the Family
          </h2>
          <p className="mb-8 mt-3 text-sm text-[#b8a896]">
            New collections, restocks, and 10% off your first order.
          </p>
          <div className="flex justify-center">
            <NewsletterForm cta="Join Now" pill />
          </div>
        </div>
      </section>
    </>
  );
}
