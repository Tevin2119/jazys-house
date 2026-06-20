export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveTheme } from "@/lib/theme";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function SettingsPage() {
  const { tenantId } = await getAdminContext();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });
  if (!tenant) notFound();

  const theme = resolveTheme(tenant.theme);

  return (
    <div>
      <h1
        style={{
          fontFamily: "'Marcellus', serif",
          fontSize: 30,
          margin: "0 0 16px",
          fontWeight: 400,
        }}
      >
        Store Settings
      </h1>

      <SettingsForm
        name={tenant.name}
        currency={tenant.currency}
        primary={theme.primary}
        slug={tenant.slug}
        domain={tenant.domain}
      />
    </div>
  );
}
