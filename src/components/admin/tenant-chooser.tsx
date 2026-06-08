"use client";

import { useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import type { TenantOption } from "./tenant-switcher";

/** Full-page store picker for a super admin with no active store selected. */
export function TenantChooser({ tenants }: { tenants: TenantOption[] }) {
  const { update } = useSession();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(id: string) {
    startTransition(async () => {
      await update({ activeTenantId: id });
      router.replace("/admin");
      router.refresh();
    });
  }

  if (tenants.length === 0) {
    return (
      <p className="text-muted-foreground">
        No stores exist yet. Create a tenant before administering it.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {tenants.map((t) => (
        <button
          key={t.id}
          onClick={() => choose(t.id)}
          disabled={pending}
          className="flex items-center gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-accent disabled:opacity-50"
        >
          <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Store className="size-5" />
          </span>
          <span className="font-medium">{t.name}</span>
        </button>
      ))}
    </div>
  );
}
