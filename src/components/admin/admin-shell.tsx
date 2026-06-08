"use client";

import { useState, type ReactNode } from "react";
import { Menu, X, Store } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { TenantSwitcher, type TenantOption } from "./tenant-switcher";
import { UserMenu } from "./user-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  user: { name: string | null; email: string; role: string };
  tenants: TenantOption[];
  activeTenantId: string | null;
  activeTenantName: string | null;
  activeTenantLogoUrl: string | null;
  isSuperAdmin: boolean;
  children: ReactNode;
}

export function AdminShell({
  user,
  tenants,
  activeTenantId,
  activeTenantName,
  activeTenantLogoUrl,
  isSuperAdmin,
  children,
}: AdminShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile backdrop */}
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-card transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <span className="flex items-center gap-2 overflow-hidden">
            {activeTenantLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- tenant-supplied dynamic URL
              <img
                src={activeTenantLogoUrl}
                alt={activeTenantName ?? "Store"}
                className="size-8 shrink-0 rounded-md object-cover"
              />
            ) : null}
            <span className="truncate text-lg font-bold">
              {activeTenantName ?? "Jazy's House"}
            </span>
          </span>
          <button
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>
        <SidebarNav
          onNavigate={() => setOpen(false)}
          isSuperAdmin={isSuperAdmin}
        />
      </aside>

      {/* Content column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur">
          <button
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          {isSuperAdmin ? (
            <TenantSwitcher tenants={tenants} activeTenantId={activeTenantId} />
          ) : (
            <Badge variant="secondary" className="gap-1.5">
              <Store className="size-3.5" />
              {activeTenantName ?? "—"}
            </Badge>
          )}

          {activeTenantName ? (
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
              <span className="size-2 rounded-full bg-green-500" />
              Active store
            </span>
          ) : null}

          <div className="ml-auto flex items-center gap-3">
            <UserMenu name={user.name} email={user.email} role={user.role} />
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
