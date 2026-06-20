import Link from "next/link";

const SHOP_LINKS = [
  { slug: "women", label: "Women" },
  { slug: "men", label: "Men" },
  { slug: "kids", label: "Kids" },
  { slug: "accessories", label: "Accessories" },
  { slug: "pantry", label: "Pantry" },
  { slug: "home", label: "Home" },
];

/** Storefront footer — brand, shop/company links, follow links, newsletter. */
export function StoreFooter() {
  return (
    <footer className="mt-20 bg-[var(--foreground)] text-[#d4c8b8]">
      <div className="mx-auto max-w-[1400px] px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="font-heading text-lg font-bold italic text-white">
              Jazy&apos;s <span className="text-primary not-italic">House</span>
            </h3>
            <p className="mt-2 text-sm text-[#b8a896]">
              African fashion, handmade accessories &amp; healthy African good
              food. From our hands to your heart. Est. 2025.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white">
              Shop
            </h4>
            <ul className="space-y-2 text-sm">
              {SHOP_LINKS.map((l) => (
                <li key={l.slug}>
                  <Link
                    href={`/shop?cat=${l.slug}`}
                    className="transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white">
              Company
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="transition-colors hover:text-white">
                  Our Story
                </Link>
              </li>
              <li>
                <Link
                  href="/catering"
                  className="transition-colors hover:text-white"
                >
                  Catering
                </Link>
              </li>
              <li>
                <a
                  href="mailto:faye.dienaba@yahoo.com"
                  className="transition-colors hover:text-white"
                >
                  faye.dienaba@yahoo.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white">
              Follow
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.instagram.com/jazy_shouse"
                  className="transition-colors hover:text-white"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://www.tiktok.com/@africanfood6"
                  className="transition-colors hover:text-white"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  TikTok
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-[#9a8b7d]">
          <div className="mb-2">Pay in ¥ JPY · £ GBP · $ USD · € EUR · CFA Franc (XOF)</div>
          © 2025 Jazy&apos;s House Tokyo. All rights reserved. Made with love.
        </div>
      </div>
    </footer>
  );
}
