export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { TenantForm } from "@/components/admin/tenant-form";
import { resolveTheme } from "@/lib/theme";
import { updateTenant } from "../../actions";

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) notFound();

  return (
    <div>
      <PageHeader
        title={`Edit ${tenant.name}`}
        description="Update branding, domain, and currency for this store."
      />
      <TenantForm
        action={updateTenant}
        mode="edit"
        tenant={{
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          domain: tenant.domain,
          currency: tenant.currency,
        }}
        theme={resolveTheme(tenant.theme)}
      />
    </div>
  );
}
