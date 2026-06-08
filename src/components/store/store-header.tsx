"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CartBadge } from "@/components/store/cart-badge";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/catering", label: "Catering" },
  { href: "/about", label: "Our Story" },
];

/** Sticky storefront header with desktop nav, cart badge, and mobile menu. */
export function StoreHeader({
  storeName,
  logoUrl,
}: {
  storeName: string;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label={storeName}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- tenant-supplied dynamic URL, not statically whitelistable
            <img
              src={logoUrl}
              alt={storeName}
              width={44}
              height={44}
              className="h-11 w-11 rounded-md object-cover"
            />
          ) : (
            <Image
              src="/images/logo.jpg"
              alt={storeName}
              width={44}
              height={44}
              className="h-11 w-11 rounded-md object-cover"
              priority
            />
          )}
          <span className="leading-tight">
            <span className="font-heading text-lg font-extrabold italic">
              {storeName}
            </span>
            <span className="block text-[0.5rem] font-normal uppercase tracking-[2px] text-primary">
              African Fashion &amp; Healthy Good Food
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-xs font-medium uppercase tracking-wider transition-colors hover:text-foreground",
                isActive(item.href) ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative text-xl"
          >
            🛒
            <CartBadge />
          </Link>
        </nav>

        <div className="flex items-center gap-4 md:hidden">
          <Link href="/cart" aria-label="Cart" className="relative text-xl">
            🛒
            <CartBadge />
          </Link>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="text-2xl leading-none"
          >
            ☰
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-border bg-background md:hidden">
          <ul className="flex flex-col px-6 py-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block py-3 text-sm font-medium uppercase tracking-wider",
                    isActive(item.href)
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
