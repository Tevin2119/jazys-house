import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/store/section";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Story — African Fashion & Food, Handmade with Love",
  description:
    "About Jazy's House — your home for African handmade fashion & authentic African catering. Crafted with love, rooted in African culture.",
};

const VALUES = [
  {
    icon: "🤲",
    title: "Craftsmanship",
    text: "Every stitch. Every bead. Every dish. Made by hand, made with pride.",
  },
  {
    icon: "🌍",
    title: "Authenticity",
    text: "Real African fabrics. Real African flavors. No shortcuts, no imitations.",
  },
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Community",
    text: "When you buy from us, you support real artisans and cooks.",
  },
  {
    icon: "🔥",
    title: "Boldness",
    text: "African fashion is not a trend — it's a statement. Wear it loud.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section className="bg-[var(--warm)]">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <div className="mb-4 inline-block rounded-full bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary shadow-sm">
            Our Story
          </div>
          <h1 className="font-heading text-5xl font-extrabold italic leading-[1.05] sm:text-6xl">
            From Our Hands
            <br />
            to Your Heart
          </h1>
          <p className="mt-5 text-muted-foreground">
            A love letter to African craft, culture, and cuisine.
          </p>
        </div>
      </section>

      {/* STORY */}
      <section className="mx-auto max-w-[1400px] px-6 py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl shadow-sm">
            <Image
              src="/images/chef-dienaba.jpg"
              alt="Chef Dienaba — Jazy's House"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[3px] text-primary">
              The Vision
            </div>
            <h2 className="font-heading text-3xl font-bold italic">
              More Than a Brand — A Heritage
            </h2>
            <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Jazy&apos;s House was born from a simple truth:{" "}
                <strong className="text-foreground">
                  African craft is world-class.
                </strong>{" "}
                Our fabrics tell stories. Our food brings people together. For
                too long, the world has slept on what the continent has to
                offer.
              </p>
              <p>
                Every piece in our collection is handmade. Every dish on our
                catering menu comes from recipes passed down through
                generations —{" "}
                <strong className="text-foreground">
                  prepared by our Senegalese chef
                </strong>
                . We don&apos;t cut corners — we pour heart into everything we
                do.
              </p>
              <p className="text-foreground">
                <strong>Welcome to Jazy&apos;s House. You&apos;re family now.</strong>{" "}
                🧡
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="bg-[var(--warm)]">
        <div className="mx-auto max-w-[1400px] px-6 py-20">
          <SectionHeading
            label="What We Stand For"
            title="The Heart of the House"
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="rounded-xl border border-border bg-card p-8 text-center shadow-sm"
              >
                <div className="text-4xl">{v.icon}</div>
                <h4 className="mt-3 font-semibold">{v.title}</h4>
                <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1400px] px-6 py-20 text-center">
        <SectionHeading
          title="Ready to wear it with pride?"
          subtitle="Explore the collection or bring African flavors to your next event."
        />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/shop"
            className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--accent-hover)]"
          >
            Shop the Collection
          </Link>
          <Link
            href="/catering"
            className="rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
          >
            Book Catering
          </Link>
        </div>
      </section>
    </>
  );
}
