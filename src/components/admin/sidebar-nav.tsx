"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/products", label: "Products", icon: "🧺", exact: false },
  { href: "/admin/orders", label: "Orders", icon: "📦", exact: false },
  { href: "/admin/catering", label: "Catering", icon: "🍲", exact: false },
  { href: "/admin/customers", label: "Customers", icon: "👥", exact: false },
  { href: "/admin/metrics", label: "Metrics", icon: "📈", exact: false },
  { href: "/admin/query-builder", label: "Queries", icon: "🔍", exact: false },
  { href: "/admin/settings", label: "Settings", icon: "⚙️", exact: false },
] as const;

const SUPER_ADMIN_NAV = [
  { href: "/admin/users", label: "Users", icon: "🔑", exact: false },
  { href: "/admin/tenants", label: "Stores", icon: "🏪", exact: false },
] as const;

export function SidebarNav({
  onNavigate,
  isSuperAdmin = false,
}: {
  onNavigate?: () => void;
  isSuperAdmin?: boolean;
}) {
  const pathname = usePathname();
  const items = isSuperAdmin ? [...NAV, ...SUPER_ADMIN_NAV] : NAV;

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map(({ href, label, icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
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
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
