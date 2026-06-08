"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  UtensilsCrossed,
  Settings,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package, exact: false },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, exact: false },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, exact: false },
  { href: "/admin/catering", label: "Catering", icon: UtensilsCrossed, exact: false },
  { href: "/admin/settings", label: "Settings", icon: Settings, exact: false },
] as const;

// SUPER_ADMIN-only routes (cross-tenant management).
const SUPER_ADMIN_NAV = [
  { href: "/admin/tenants", label: "Stores", icon: Building2, exact: false },
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
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
