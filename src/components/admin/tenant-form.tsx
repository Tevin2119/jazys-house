"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/admin/submit-button";
import { ThemeFields, type ThemeFieldsValue } from "@/components/admin/theme-fields";
import type { TenantActionState } from "@/app/(admin)/admin/tenants/actions";

interface TenantFormProps {
  action: (
    prev: TenantActionState,
    formData: FormData,
  ) => Promise<TenantActionState>;
  mode: "create" | "edit";
  tenant?: {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    currency: string;
  };
  theme: ThemeFieldsValue;
}

/** Create / edit form for a tenant (SUPER_ADMIN). */
export function TenantForm({ action, mode, tenant, theme }: TenantFormProps) {
  const [state, formAction] = useActionState<TenantActionState, FormData>(
    action,
    {},
  );

  return (
    <form
      action={formAction}
      className="max-w-xl space-y-4 rounded-lg border bg-card p-6"
    >
      {tenant ? <input type="hidden" name="id" value={tenant.id} /> : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Store name</Label>
        <Input id="name" name="name" defaultValue={tenant?.name} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          {mode === "create" ? (
            <Input
              id="slug"
              name="slug"
              placeholder="afrochic"
              required
            />
          ) : (
            <Input id="slug" value={tenant?.slug} disabled readOnly />
          )}
          <p className="text-xs text-muted-foreground">
            {mode === "create"
              ? "Used for subdomain + path routing. Lower-case, no spaces."
              : "Immutable — storefront URLs depend on it."}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            name="currency"
            defaultValue={tenant?.currency ?? "gbp"}
            placeholder="gbp"
            maxLength={3}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="domain">Custom domain (optional)</Label>
        <Input
          id="domain"
          name="domain"
          defaultValue={tenant?.domain ?? ""}
          placeholder="afrochic.com"
        />
      </div>

      {mode === "create" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="adminEmail">Owner email</Label>
            <Input
              id="adminEmail"
              name="adminEmail"
              type="email"
              placeholder="owner@afrochic.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminPassword">Owner password</Label>
            <Input
              id="adminPassword"
              name="adminPassword"
              type="password"
              minLength={8}
              required
            />
          </div>
        </div>
      ) : null}

      <div className="border-t pt-4">
        <ThemeFields theme={theme} />
      </div>

      <SubmitButton>
        {mode === "create" ? "Create store" : "Save changes"}
      </SubmitButton>
    </form>
  );
}
