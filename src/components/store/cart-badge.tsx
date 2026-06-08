"use client";

import { useEffect, useState } from "react";
import { CART_EVENT, cartCount } from "@/lib/cart";

/**
 * Cart count badge in the nav. Hydrates from localStorage on mount and stays in
 * sync via the in-tab cart event plus the cross-tab `storage` event.
 */
export function CartBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(cartCount());
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (count <= 0) return null;

  return (
    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-bold text-primary-foreground">
      {count}
    </span>
  );
}
