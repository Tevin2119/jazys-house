"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/admin/submit-button";

interface ProductFormProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryId: string | null;
  images: string[];
  emoji: string | null;
  badge: string | null;
  stock: number;
}

/** Shared create/edit form for products. */
export function ProductForm({
  action,
  categories,
  product = null,
}: {
  action: (fd: FormData) => void;
  categories: { id: string; name: string }[];
  product?: ProductFormProduct | null;
}) {
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "none");

  return (
    <form
      action={action}
      className="max-w-2xl space-y-4 rounded-lg border bg-card p-6"
    >
      {product ? (
        <input type="hidden" name="id" value={product.id} />
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={product?.name ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product?.description ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Price (GBP)</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={product ? product.price / 100 : ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <input type="hidden" name="categoryId" value={categoryId} />
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="category">
            <SelectValue placeholder="No category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No category</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="images">Images</Label>
        <Textarea
          id="images"
          name="images"
          rows={3}
          placeholder="One URL per line"
          defaultValue={product?.images.join("\n") ?? ""}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="emoji">Emoji</Label>
          <Input
            id="emoji"
            name="emoji"
            maxLength={8}
            defaultValue={product?.emoji ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="badge">Badge</Label>
          <Input
            id="badge"
            name="badge"
            defaultValue={product?.badge ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            defaultValue={product?.stock ?? 999}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <SubmitButton>Save product</SubmitButton>
        <Button variant="outline" asChild>
          <Link href="/admin/products">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
