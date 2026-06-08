export const dynamic = "force-dynamic";

import { requireSuperAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { TenantForm } from "@/components/admin/tenant-form";
import { DEFAULT_THEME } from "@/lib/theme";
import { createTenant } from "../actions";

export default async function NewTenantPage() {
  await requireSuperAdmin();

  return (
    <div>
      <PageHeader
        title="New store"
        description="Provisions the store, its default categories, and a first owner account."
      />
      <TenantForm action={createTenant} mode="create" theme={DEFAULT_THEME} />
    </div>
  );
}
