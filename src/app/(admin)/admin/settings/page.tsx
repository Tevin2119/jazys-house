export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { ThemeEditor } from "@/components/admin/theme-editor";
import { resolveTheme } from "@/lib/theme";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateTenantSettings } from "./actions";

export default async function SettingsPage() {
  const { tenantId } = await getAdminContext();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });
  if (!tenant) notFound();

  const theme = resolveTheme(tenant.theme);

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Store details</CardTitle>
            <CardDescription>
              Read-only identifiers for this store.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Slug</dt>
              <dd>{tenant.slug}</dd>
              <dt className="text-muted-foreground">Domain</dt>
              <dd>{tenant.domain ?? "—"}</dd>
              <dt className="text-muted-foreground">Currency</dt>
              <dd>{tenant.currency.toUpperCase()}</dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>
              Customize your store name, colors, and font.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeEditor
              action={updateTenantSettings}
              name={tenant.name}
              theme={theme}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
