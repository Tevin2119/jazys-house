"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart";

/**
 * Clears the localStorage cart on mount. Rendered on the order confirmation page
 * so a completed order empties the cart (the order itself already lives in the
 * DB; the client cart is just the pre-checkout staging area).
 */
export function ClearCart() {
  useEffect(() => {
    clearCart();
  }, []);
  return null;
}
