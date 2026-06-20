"use client";

import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { TenantSwitcher, type TenantOption } from "./tenant-switcher";
import { UserMenu } from "./user-menu";
import { cn } from "@/lib/utils";
import { AdminTabBar } from "./admin-tab-bar";

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
  const initial = (user.name ?? user.email).charAt(0).toUpperCase();

  return (
    <div className="min-h-screen" style={{ background: "#f3ede2" }}>
      {/* Mobile backdrop */}
      {open ? (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(42,31,22,0.45)" }}
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ background: "#221913", color: "#cbb9a3" }}
      >
        {/* Logo / store name header */}
        <div
          className="flex shrink-0 items-center justify-between px-4 py-[22px]"
          style={{ borderBottom: "1px solid #3a2c20", marginBottom: "4px" }}
        >
          <div className="flex items-center gap-3">
            {activeTenantLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeTenantLogoUrl}
                alt={activeTenantName ?? "Store"}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1.5px solid #c79a55",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "#c79a55",
                  color: "#221913",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 16,
                  flexShrink: 0,
                  border: "1.5px solid #c79a55",
                }}
              >
                {(activeTenantName ?? "J").charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ lineHeight: 1.1 }}>
              <div
                style={{
                  fontFamily: "'Marcellus', serif",
                  fontSize: 16,
                  color: "#f6efe4",
                }}
              >
                {activeTenantName ?? "Jazy's House"}
              </div>
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "1.5px",
                  color: "#8a7c6a",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                ADMIN
              </div>
            </div>
          </div>
          <button
            className="lg:hidden"
            style={{ color: "#cbb9a3" }}
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto">
          <SidebarNav
            onNavigate={() => setOpen(false)}
            isSuperAdmin={isSuperAdmin}
          />
        </div>

        {/* User profile at bottom */}
        <div
          className="shrink-0 flex items-center gap-3 px-4 py-4"
          style={{ borderTop: "1px solid #3a2c20" }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#c79a55",
              color: "#221913",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div style={{ lineHeight: 1.2, minWidth: 0 }}>
            <div
              className="truncate"
              style={{ fontSize: 13, color: "#f6efe4", fontWeight: 600 }}
            >
              {user.name ?? user.email}
            </div>
            <div style={{ fontSize: 11, color: "#8a7c6a" }}>
              {user.role === "SUPER_ADMIN" ? "Platform Admin" : "Store Owner"}
            </div>
          </div>
        </div>
      </aside>

      {/* Content column */}
      <div className="lg:pl-[248px]">
        {/* Topbar */}
        <div
          className="sticky top-0 z-30 flex items-center justify-between gap-5 px-8 py-3.5"
          style={{
            background: "#fffdf9",
            borderBottom: "1px solid #e6dccb",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" style={{ color: "#6b5d4f" }} />
            </button>

            {isSuperAdmin ? (
              <TenantSwitcher
                tenants={tenants}
                activeTenantId={activeTenantId}
              />
            ) : (
              <div
                className="flex items-center gap-2 rounded-[9px] px-3.5 py-2 text-[13.5px] font-semibold cursor-pointer"
                style={{
                  background: "#f3ede2",
                  border: "1px solid #e6dccb",
                  color: "#2a1f16",
                }}
              >
                🏪 {activeTenantName ?? "Jazy's House"}
                <span style={{ color: "#a39685" }}>▾</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span style={{ fontSize: 18, cursor: "pointer" }}>🔔</span>
            <span
              className="hidden sm:block text-[13.5px]"
              style={{ color: "#6b5d4f" }}
            >
              {activeTenantName
                ? `${activeTenantName.toLowerCase().replace(/\s+/g, "-")}.com`
                : "jazyshouse.com"}
            </span>
            <UserMenu name={user.name} email={user.email} role={user.role} />
          </div>
        </div>

        <main className="p-8 pb-24 lg:pb-8">{children}</main>
      </div>

      <AdminTabBar />
    </div>
  );
}
