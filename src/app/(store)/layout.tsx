import type { ReactNode } from "react";
import { getCurrentTenant } from "@/lib/tenant";
import { resolveTheme, themeToCssVars } from "@/lib/theme";
import { StoreHeader } from "@/components/store/store-header";
import { StoreFooter } from "@/components/store/store-footer";
import { NavSwitcher } from "@/components/store/nav-switcher";

/**
 * Storefront layout shell — LAYOUT-BASED tenant resolution.
 *
 * Resolves the tenant from the request host (set by middleware) in the Node
 * runtime, projects the tenant's theme to CSS variables (falling back to the
 * brand default for any missing/invalid value), and wraps every page in the
 * shared storefront chrome (header + footer).
 */
export default async function StoreLayout({
  children,
}: {
  children: ReactNode;
}) {
  const tenant = await getCurrentTenant();
  const theme = resolveTheme(tenant?.theme);

  return (
    <div
      data-tenant={tenant?.slug ?? "none"}
      style={themeToCssVars(theme)}
      className="flex min-h-screen flex-col"
    >
      <div
        className="w-full py-2.5 text-center text-[11px] font-semibold uppercase tracking-[1.6px]"
        style={{ background: "#2a1f16", color: "#f5ede0" }}
      >
        African Fashion &amp; Healthy Good Food &nbsp;·&nbsp; Worldwide Delivery &nbsp;·&nbsp; Custom Made-To-Order
      </div>
      <StoreHeader
        storeName={tenant?.name ?? "Jazy's House"}
        logoUrl={theme.logoUrl}
        currency={tenant?.currency ?? "gbp"}
      />
      <main className="flex-1 pb-24">{children}</main>
      <StoreFooter />
      <NavSwitcher />
    </div>
  );
}
