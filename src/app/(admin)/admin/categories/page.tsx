export const dynamic = "force-dynamic";

import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryDialog } from "@/components/admin/category-dialog";
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
import { createCategory, deleteCategory, updateCategory } from "./actions";

export default async function CategoriesPage() {
  const { tenantId } = await getAdminContext();

  const categories = await prisma.category.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Categories"
        action={
          <CategoryDialog
            action={createCategory}
            trigger={<Button>New category</Button>}
          />
        }
      />

      {categories.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No categories yet. Create your first category to organize products.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Products</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {c.slug}
                </TableCell>
                <TableCell>{c._count.products}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <CategoryDialog
                      action={updateCategory}
                      category={c}
                      trigger={
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      }
                    />
                    <form action={deleteCategory}>
                      <input type="hidden" name="id" value={c.id} />
                      <ConfirmSubmitButton
                        variant="ghost"
                        size="sm"
                        confirmText="Delete this category?"
                        disabled={c._count.products > 0}
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
