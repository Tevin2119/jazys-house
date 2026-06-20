"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CartBadge } from "@/components/store/cart-badge";
import { CartDrawer } from "@/components/store/cart-drawer";
import { MobileMenu } from "@/components/store/mobile-menu";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/catering", label: "Catering" },
  { href: "/about", label: "Our Story" },
];

/** Sticky storefront header with desktop nav, cart pill button (opens drawer), and mobile menu. */
export function StoreHeader({
  storeName,
  logoUrl,
  currency = "gbp",
}: {
  storeName: string;
  logoUrl?: string | null;
  currency?: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const CartButton = ({ className }: { className?: string }) => (
    <button
      type="button"
      aria-label="Open cart"
      onClick={() => setCartOpen(true)}
      className={cn(
        "relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#a3442e]",
        className,
      )}
      style={{ background: "#c0563d" }}
    >
      🛒
      <CartBadge inline />
    </button>
  );

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label={storeName}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- tenant-supplied dynamic URL, not statically whitelistable
              <img
                src={logoUrl}
                alt={storeName}
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover"
                style={{ border: "1.5px solid #c79a55" }}
              />
            ) : (
              <Image
                src="/images/logo.jpg"
                alt={storeName}
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover"
                style={{ border: "1.5px solid #c79a55" }}
                priority
              />
            )}
            <span className="leading-tight">
              <span className="font-heading text-[19px] font-normal">
                {storeName}
              </span>
              <span
                className="block text-[8.5px] font-semibold uppercase tracking-[2px]"
                style={{ color: "#a3442e" }}
              >
                African Fashion &amp; Good Food
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-[14.5px] font-semibold transition-colors hover:text-foreground",
                  isActive(item.href) ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
            <CartButton />
          </nav>

          <div className="flex items-center gap-3 md:hidden">
            <CartButton />
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="text-2xl leading-none"
            >
              ☰
            </button>
          </div>
        </div>

      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        currency={currency}
      />
    </>
  );
}
