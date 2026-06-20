"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import type { ReactNode } from "react";

function NavPill({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
      style={{
        background: isActive ? "#c0563d" : "transparent",
        color: isActive ? "#fff" : "#cbb9a3",
      }}
    >
      {children}
    </Link>
  );
}

export function NavSwitcher() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Don't show on admin pages — admin has its own nav
  if (pathname.startsWith("/admin") || pathname.startsWith("/login")) return null;

  if (status === "loading") return null;

  const role = session?.user?.role;
  const isAdmin = role === "SUPER_ADMIN" || role === "TENANT_ADMIN";

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <nav
        className="flex items-center gap-1 rounded-full px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
        style={{ background: "#221913" }}
        aria-label="Quick navigation"
      >
        {!session ? (
          <NavPill href="/login">Login</NavPill>
        ) : (
          <>
            <NavPill href="/">Storefront</NavPill>
            <NavPill href="/shop">Shop</NavPill>
            {isAdmin && <NavPill href="/admin">Admin</NavPill>}
            {!isAdmin && <NavPill href="/wishlist">Wishlist ♡</NavPill>}
            <NavPill href="/account">My Account</NavPill>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="ml-1 rounded-full px-3 py-2 text-sm font-semibold text-[#8a7c6a] transition-colors hover:bg-white/10"
              title="Logout"
            >
              🚪
            </button>
          </>
        )}
      </nav>
    </div>
  );
}
