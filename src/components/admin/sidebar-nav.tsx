"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface BadgeCounts {
  pendingOrders: number;
  unreadMessages: number;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  badge?: keyof BadgeCounts;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Insights",
    items: [
      { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
      { href: "/admin/metrics", label: "Metrics", icon: "📈" },
      { href: "/admin/query-builder", label: "Queries", icon: "🔍" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/orders", label: "Orders", icon: "📦", badge: "pendingOrders" },
      { href: "/admin/products", label: "Products", icon: "🧺" },
      { href: "/admin/refunds", label: "Refunds", icon: "↩️" },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/admin/customers", label: "Customers", icon: "👥" },
      { href: "/admin/messages", label: "Messages", icon: "💬", badge: "unreadMessages" },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/admin/employees", label: "Employees", icon: "👤" },
      { href: "/admin/integrations", label: "Integrations", icon: "🔌" },
      { href: "/admin/settings/carriers", label: "Shipping", icon: "🚚" },
      { href: "/admin/catering", label: "Catering", icon: "🍲" },
      { href: "/admin/settings", label: "Settings", icon: "⚙️" },
    ],
  },
];

const SUPER_ADMIN_GROUP: NavGroup = {
  label: "Platform",
  items: [
    { href: "/admin/users", label: "Users", icon: "🔑" },
    { href: "/admin/tenants", label: "Stores", icon: "🏪" },
  ],
};

export function SidebarNav({
  onNavigate,
  isSuperAdmin = false,
  badgeCounts,
}: {
  onNavigate?: () => void;
  isSuperAdmin?: boolean;
  badgeCounts?: BadgeCounts;
}) {
  const pathname = usePathname();
  const groups = isSuperAdmin ? [...NAV_GROUPS, SUPER_ADMIN_GROUP] : NAV_GROUPS;

  return (
    <nav className="flex flex-col gap-4 p-3">
      {groups.map((group) => (
        <div key={group.label}>
          <div
            className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[1.5px]"
            style={{ color: "#6b5748" }}
          >
            {group.label}
          </div>
          {group.items.map(({ href, label, icon, exact, badge }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            const count = badge && badgeCounts ? badgeCounts[badge] : 0;
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#c0563d] font-bold text-white"
                    : "font-[500] text-[#cbb9a3] hover:bg-[#3d2a1e] hover:text-white",
                )}
              >
                <span className="text-base leading-none">{icon}</span>
                <span className="flex-1">{label}</span>
                {count > 0 && (
                  <span
                    className="flex items-center justify-center rounded-full text-[10px] font-bold leading-none"
                    style={{
                      background: active ? "rgba(255,255,255,0.25)" : "#c0563d",
                      color: "white",
                      minWidth: 18,
                      height: 18,
                      padding: "0 5px",
                    }}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
