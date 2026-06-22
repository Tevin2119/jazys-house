"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";

interface BadgeCounts {
  pendingOrders: number;
  unreadMessages: number;
}

interface TabItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  badge?: keyof BadgeCounts;
}

const MAIN_TABS: TabItem[] = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/orders", label: "Orders", icon: "📦", badge: "pendingOrders" },
  { href: "/admin/messages", label: "Messages", icon: "💬", badge: "unreadMessages" },
  { href: "/admin/catering", label: "Catering", icon: "🍲" },
];

const MORE_ITEMS = [
  { href: "/admin/products", label: "Products", icon: "🧺" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/employees", label: "Employees", icon: "👤" },
  { href: "/admin/refunds", label: "Refunds", icon: "↩️" },
  { href: "/admin/metrics", label: "Metrics", icon: "📈" },
  { href: "/admin/query-builder", label: "Queries", icon: "🔍" },
  { href: "/admin/integrations", label: "Integrations", icon: "🔌" },
  { href: "/admin/settings/carriers", label: "Shipping", icon: "🚚" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export function AdminTabBar({ badgeCounts }: { badgeCounts?: BadgeCounts }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(42,31,22,0.45)" }}
          onClick={() => setMoreOpen(false)}
          aria-hidden
        />
      )}

      {moreOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl lg:hidden"
          style={{
            background: "#fffdf9",
            borderTop: "1px solid #e6dccb",
            paddingBottom: "env(safe-area-inset-bottom, 16px)",
          }}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <span style={{ fontSize: 14, fontWeight: 700, color: "#2a1f16" }}>
              More
            </span>
            <button onClick={() => setMoreOpen(false)} aria-label="Close more menu">
              <X className="size-5" style={{ color: "#6b5d4f" }} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 px-4 pb-4">
            {MORE_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center gap-1.5 rounded-xl py-3"
                  style={{ background: active ? "#f3ede2" : "transparent" }}
                >
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: active ? "#c0563d" : "#6b5d4f",
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden"
        style={{
          background: "#fffdf9",
          borderTop: "1px solid #e6dccb",
          paddingBottom: "env(safe-area-inset-bottom, 8px)",
        }}
      >
        {MAIN_TABS.map((tab) => {
          const active = isActive(tab.href, tab.exact);
          const count = tab.badge && badgeCounts ? badgeCounts[tab.badge] : 0;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2"
            >
              <span className="relative inline-flex">
                <span
                  style={{
                    fontSize: 19,
                    lineHeight: 1,
                    opacity: active ? 1 : 0.55,
                  }}
                >
                  {tab.icon}
                </span>
                {count > 0 && (
                  <span
                    className="absolute -right-2 -top-1 flex items-center justify-center rounded-full font-bold"
                    style={{
                      background: "#c0563d",
                      color: "white",
                      fontSize: 9,
                      minWidth: 14,
                      height: 14,
                      padding: "0 3px",
                      lineHeight: 1,
                    }}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
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
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
        >
          <span style={{ fontSize: 19, lineHeight: 1, opacity: 0.55 }}>⋯</span>
          <span style={{ fontSize: 10, fontWeight: 500, color: "#9c8e7d" }}>More</span>
        </button>
      </nav>
    </>
  );
}
