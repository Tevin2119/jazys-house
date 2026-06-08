import type { Metadata } from "next";
import Image from "next/image";
import { CATERING_PACKAGES } from "@/lib/catering-packages";
import { CateringForm } from "@/components/store/catering-form";
import { SectionHeading } from "@/components/store/section";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "African Catering — Authentic African Food for Events",
  description:
    "African catering — jollof rice, suya, braai, puff-puff and full West African banquets. Authentic African cuisine for parties, weddings and events.",
};

const STEPS = [
  {
    icon: "📋",
    title: "1. Tell Us Your Vision",
    text: "Fill out the form — date, guests, vibe. We respond within 24 hours.",
  },
  {
    icon: "🍲",
    title: "2. We Craft Your Menu",
    text: "A custom menu designed around your taste, budget, and dietary needs.",
  },
  {
    icon: "🎉",
    title: "3. We Bring the Feast",
    text: "Our team arrives, sets up, serves, and cleans. You enjoy your guests.",
  },
];

export default function CateringPage() {
  return (
    <>
      {/* HERO */}
      <section className="bg-[var(--warm)]">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <div className="mb-4 inline-block rounded-full bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary shadow-sm">
            Catering
          </div>
          <h1 className="font-heading text-5xl font-extrabold italic leading-[1.05] sm:text-6xl">
            The Taste of
            <br />
            Home
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Authentic African cuisine, made with love. From intimate dinners to
            grand celebrations — we bring the flavors of the continent to your
            table.
          </p>
          <a
            href="#book"
            className="mt-8 inline-block rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--accent-hover)]"
          >
            Book Your Event
          </a>
        </div>
      </section>

      {/* SHOWCASE */}
      <section className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
          <figure className="overflow-hidden rounded-xl shadow-sm">
            <Image
              src="/images/restaurant-flyer.jpg"
              alt="Senegalese cuisine flyer"
              width={600}
              height={800}
              className="h-auto w-full"
            />
            <figcaption className="mt-2 text-center text-sm text-muted-foreground">
              🇸🇳 Authentic Senegalese cuisine — made by a Senegalese chef
            </figcaption>
          </figure>
          <figure className="overflow-hidden rounded-xl shadow-sm">
            <Image
              src="/images/senegalese-menu.jpg"
              alt="Senegalese food menu — Chicken Yassa, Fataya, Mafé, Bissap, Beignet"
              width={600}
              height={800}
              className="h-auto w-full"
            />
            <figcaption className="mt-2 text-center text-sm text-muted-foreground">
              Chicken Yassa · Fataya · Mafé · Bissap Juice · Beignet
            </figcaption>
          </figure>
        </div>
      </section>

      {/* PACKAGES */}
      <section className="bg-[var(--warm)]">
        <div className="mx-auto max-w-[1400px] px-6 py-20">
          <SectionHeading
            label="Our Menu"
            title="Catering Packages"
            subtitle="Every menu is customizable. Dietary needs? Halal? Vegetarian? We've got you."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CATERING_PACKAGES.map((c) => (
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
        </div>
      </section>

      {/* CHEF */}
      <section className="mx-auto max-w-[1400px] px-6 py-20">
        <div className="mx-auto grid max-w-3xl items-center gap-8 sm:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl shadow-sm">
            <Image
              src="/images/chef-dienaba-2.jpg"
              alt="Chef Dienaba"
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[3px] text-primary">
              Meet the Chef
            </div>
            <h2 className="font-heading text-3xl font-bold italic">
              Authentic Senegalese Cuisine
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              🇸🇳 From Dakar to your table — <strong>Chef Dienaba</strong> brings
              the true taste of Senegal. Chicken Yassa, Mafé, Fataya,
              Thieboudienne… every dish is a journey home.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              📞 080-4357-0980
              <br />
              📧 faye.dienaba@yahoo.com
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[var(--warm)]">
        <div className="mx-auto max-w-[1400px] px-6 py-20">
          <SectionHeading label="How It Works" title="Your Event, Our Kitchen" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.title}
                className="rounded-xl border border-border bg-card p-8 text-center shadow-sm"
              >
                <div className="text-4xl">{s.icon}</div>
                <h3 className="mt-3 font-heading text-lg font-bold italic">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOK */}
      <section id="book" className="mx-auto max-w-[1400px] px-6 py-20">
        <SectionHeading
          label="Get in Touch"
          title="Book Your Event"
          subtitle="Tell us about your event and we'll create the perfect African feast."
        />
        <div className="mt-10">
          <CateringForm />
        </div>
      </section>
    </>
  );
}
