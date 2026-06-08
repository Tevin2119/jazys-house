"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/admin/submit-button";

/** Create/edit dialog for a category. Reuses the same form for both modes. */
export function CategoryDialog({
  action,
  category,
  trigger,
}: {
  action: (formData: FormData) => void;
  category?: { id: string; name: string };
  trigger: ReactNode;
}) {
  const isEdit = Boolean(category);

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {category ? (
            <input type="hidden" name="id" value={category.id} />
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={category?.name}
              required
            />
          </div>
          <DialogFooter>
            <SubmitButton>Save</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
