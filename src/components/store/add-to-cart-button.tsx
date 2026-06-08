"use client";

import { useState } from "react";
import { addItem, type CartItem } from "@/lib/cart";
import { cn } from "@/lib/utils";

/**
 * Add-to-cart button (Client Component). Writes the line to the localStorage
 * cart and flashes a brief confirmation. Prices stored here are display-only and
 * re-verified server-side at checkout.
 */
export function AddToCartButton({
  product,
  className,
  label = "Add to Cart",
}: {
  product: Omit<CartItem, "quantity">;
  className?: string;
  label?: string;
}) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      aria-live="polite"
      className={cn(
        "w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-70",
        className,
      )}
    >
      {added ? "Added ✓" : label}
    </button>
  );
}
