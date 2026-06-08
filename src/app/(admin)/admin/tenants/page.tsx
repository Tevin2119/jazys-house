export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteTenant } from "./actions";

/**
 * SUPER_ADMIN-only tenant directory. `requireSuperAdmin()` bounces any
 * tenant admin to the dashboard before a single cross-tenant row is read.
 */
export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireSuperAdmin();
  const { error } = await searchParams;

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { products: true, orders: true, users: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Stores"
        description="Create and manage every storefront on the platform."
        action={
          <Button asChild size="sm">
            <Link href="/admin/tenants/new">
              <Plus className="size-4" />
              New store
            </Link>
          </Button>
        }
      />

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error === "orders"
            ? "That store has orders and cannot be deleted — orders are financial records that must be retained."
            : "Could not delete that store. Please try again."}
        </p>
      ) : null}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No stores yet.
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.slug}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.domain ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">{t._count.products}</TableCell>
                  <TableCell className="text-right">{t._count.orders}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/tenants/${t.id}/edit`}>
                          <Pencil className="size-3.5" />
                          Edit
                        </Link>
                      </Button>
                      <form action={deleteTenant}>
                        <input type="hidden" name="id" value={t.id} />
                        <ConfirmSubmitButton
                          variant="ghost"
                          size="sm"
                          confirmText={`Delete "${t.name}"? This removes its products, categories and users. Stores with orders cannot be deleted.`}
                          disabled={t._count.orders > 0}
                        >
                          <Trash2 className="size-3.5" />
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
