"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Products", icon: "🧺" },
  { href: "/admin/orders", label: "Orders", icon: "📦" },
  { href: "/admin/catering", label: "Catering", icon: "🍲" },
];

export function AdminTabBar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden"
      style={{
        background: "#fffdf9",
        borderTop: "1px solid #e6dccb",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
      }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
          >
            <span
              style={{
                fontSize: 19,
                lineHeight: 1,
                opacity: active ? 1 : 0.55,
              }}
            >
              {tab.icon}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: active ? 700 : 500,
                color: active ? "#c0563d" : "#9c8e7d",
              }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
