"use client";

import { useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Store } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TenantOption {
  id: string;
  name: string;
}

/**
 * SUPER_ADMIN-only store selector. Persists the choice into the NextAuth token
 * via `useSession().update({ activeTenantId })`, then refreshes server
 * components so every tenant-scoped query re-runs against the new tenant.
 */
export function TenantSwitcher({
  tenants,
  activeTenantId,
}: {
  tenants: TenantOption[];
  activeTenantId: string | null;
}) {
  const { update } = useSession();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const active = tenants.find((t) => t.id === activeTenantId) ?? null;

  function select(id: string) {
    if (id === activeTenantId) return;
    startTransition(async () => {
      await update({ activeTenantId: id });
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending} className="gap-2">
          <Store className="size-4" />
          <span className="max-w-[10rem] truncate">
            {active?.name ?? "Select store"}
          </span>
          <ChevronsUpDown className="size-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch store</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.length === 0 ? (
          <DropdownMenuItem disabled>No stores yet</DropdownMenuItem>
        ) : (
          tenants.map((t) => (
            <DropdownMenuItem
              key={t.id}
              onSelect={() => select(t.id)}
              className="gap-2"
            >
              <Check
                className={cn(
                  "size-4",
                  t.id === activeTenantId ? "opacity-100" : "opacity-0",
                )}
              />
              <span className="truncate">{t.name}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
