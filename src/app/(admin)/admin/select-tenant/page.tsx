import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TenantChooser } from "@/components/admin/tenant-chooser";

export const dynamic = "force-dynamic";

/**
 * Super-admin store picker. Tenant admins always have a resolved tenant, so they
 * never reach this page — `requireSuperAdmin()` bounces them to the dashboard
 * before any tenant data is queried.
 */
export default async function SelectTenantPage() {
  await requireSuperAdmin();

  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Choose a store</h1>
      <p className="mt-1 text-muted-foreground">
        Select which store you want to administer.
      </p>
      <div className="mt-6">
        <TenantChooser tenants={tenants} />
      </div>
    </div>
  );
}
