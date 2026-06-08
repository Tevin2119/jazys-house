"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { CART_EVENT, cartSubtotal, getCart, type CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import { placeOrder, type CheckoutState } from "@/app/(store)/checkout/actions";

const INITIAL: CheckoutState = { ok: false };

const fieldClass =
  "w-full rounded-md border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

/**
 * Checkout form. Reads the localStorage cart, renders the order summary, and
 * submits shipping details + a JSON cart payload to `placeOrder`, which
 * re-prices everything server-side before creating the order.
 */
export function CheckoutForm({ currency }: { currency: string }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [state, action, pending] = useActionState(placeOrder, INITIAL);

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

  // When the server action returns a Stripe Checkout URL, hand the browser off
  // to Stripe. The cart is cleared on the confirmation page (post-payment), not
  // here — so an abandoned/cancelled payment keeps the cart intact.
  useEffect(() => {
    if (state.ok && state.url) {
      setRedirecting(true);
      window.location.href = state.url;
    }
  }, [state.ok, state.url]);

  if (!ready) return null;

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mb-4 text-6xl">🛒</div>
        <h2 className="font-heading text-2xl font-bold italic">
          Nothing to check out
        </h2>
        <p className="mt-2 text-muted-foreground">
          Add a few handmade pieces to your cart first.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--accent-hover)]"
        >
          Go to Shop →
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(cart);
  // Trusted payload: only ids + quantities; prices are re-read server-side.
  const cartPayload = JSON.stringify(
    cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <form action={action} className="grid gap-4">
        <input type="hidden" name="cart" value={cartPayload} />
        <h2 className="font-heading text-xl font-bold italic">Shipping Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <input name="name" required placeholder="Full Name" className={fieldClass} />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className={fieldClass}
          />
        </div>
        <input
          name="address1"
          required
          placeholder="Address"
          className={fieldClass}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <input name="city" required placeholder="City" className={fieldClass} />
          <input
            name="postcode"
            required
            placeholder="Postcode"
            className={fieldClass}
          />
          <input
            name="country"
            required
            placeholder="Country"
            className={fieldClass}
          />
        </div>
        {state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending || redirecting}
          className="mt-2 w-full rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-70"
        >
          {redirecting
            ? "Redirecting to payment…"
            : pending
              ? "Placing order…"
              : "Pay with Card"}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          You&apos;ll be redirected to our secure Stripe checkout to pay.
        </p>
      </form>

      <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-xl font-bold italic">Order Summary</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {cart.map((item) => (
            <li key={item.productId} className="flex justify-between gap-3">
              <span className="text-muted-foreground">
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium">
                {formatPrice(item.price * item.quantity, currency)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-bold text-primary">
            {formatPrice(subtotal, currency)}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Shipping calculated after checkout.
        </p>
      </aside>
    </div>
  );
}
