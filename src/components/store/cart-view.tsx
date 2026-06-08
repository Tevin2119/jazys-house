"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CART_EVENT,
  cartSubtotal,
  getCart,
  removeItem,
  updateQty,
  type CartItem,
} from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import { ProductImage } from "@/components/store/product-image";

/** The /cart page body — reactive over the localStorage cart. */
export function CartView({ currency }: { currency: string }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setCart(getCart());
    sync();
    setReady(true);
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Avoid a hydration flash before localStorage is read.
  if (!ready) return null;

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mb-4 text-6xl">🛒</div>
        <h2 className="font-heading text-2xl font-bold italic">
          Your cart is empty
        </h2>
        <p className="mt-2 text-muted-foreground">
          Explore our handmade collection and find something you love.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--accent-hover)]"
        >
          Shop the Collection →
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(cart);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <ul className="flex flex-col gap-4">
        {cart.map((item) => (
          <li
            key={item.productId}
            className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <ProductImage
              image={item.image}
              emoji={item.emoji}
              alt={item.name}
              sizes="96px"
              className="h-24 w-24 shrink-0 rounded-lg text-3xl"
            />
            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium leading-snug">{item.name}</h3>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-xs text-muted-foreground underline hover:text-destructive"
                >
                  Remove
                </button>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {formatPrice(item.price, currency)} each
              </div>
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Decrease quantity of ${item.name}`}
                    onClick={() => updateQty(item.productId, item.quantity - 1)}
                    className="h-7 w-7 rounded-md bg-secondary font-bold leading-none"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase quantity of ${item.name}`}
                    onClick={() => updateQty(item.productId, item.quantity + 1)}
                    className="h-7 w-7 rounded-md bg-secondary font-bold leading-none"
                  >
                    +
                  </button>
                </div>
                <div className="font-bold text-primary">
                  {formatPrice(item.price * item.quantity, currency)}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-xl font-bold italic">Order Summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-semibold">{formatPrice(subtotal, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd className="text-muted-foreground">calculated at checkout</dd>
          </div>
        </dl>
        <Link
          href="/checkout"
          className="mt-6 block rounded-md bg-primary px-6 py-3 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--accent-hover)]"
        >
          Proceed to Checkout →
        </Link>
        <Link
          href="/shop"
          className="mt-3 block text-center text-sm text-muted-foreground underline"
        >
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
