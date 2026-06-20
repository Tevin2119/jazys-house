"use client";

import { useEffect, useState } from "react";
import { CART_EVENT, cartCount } from "@/lib/cart";

/**
 * Cart count badge. Two modes:
 * - Default: absolute-positioned bubble (for use on an icon/emoji).
 * - `inline`: plain text span showing the count (for use inside a pill button).
 */
export function CartBadge({ inline = false }: { inline?: boolean }) {
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

  if (inline) {
    return <span className="font-bold">{count}</span>;
  }

  return (
    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-bold text-primary-foreground">
      {count}
    </span>
  );
}
