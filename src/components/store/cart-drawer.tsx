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
import { capturePostHogEvent } from "@/lib/posthog";

export function CartDrawer({
  open,
  onClose,
  currency,
}: {
  open: boolean;
  onClose: () => void;
  currency: string;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const initial = () => setCart(getCart());
    const sync = () => {
      const updated = getCart();
      setCart(updated);
      capturePostHogEvent("cart_updated", {
        items_count: updated.length,
        subtotal: cartSubtotal(updated),
      });
    };
    initial();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const subtotal = cartSubtotal(cart);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: "rgba(42,31,22,0.45)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="fixed right-0 top-0 z-50 flex h-full w-[380px] max-w-full flex-col shadow-2xl"
        style={{
          background: "#fffdf9",
          transform: open ? "translateX(0)" : "translateX(108%)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid #e6dccb" }}
        >
          <h2 className="font-heading text-lg" style={{ color: "#2a1f16" }}>
            Your Cart
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors hover:bg-[#efe4d2]"
            style={{ color: "#6b5d4f" }}
          >
            ✕
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="text-5xl">🛍️</div>
            <p style={{ color: "#6b5d4f" }}>Your cart is empty.</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#a3442e]"
              style={{ background: "#c0563d" }}
            >
              Shop the Collection
            </button>
          </div>
        ) : (
          <>
            <ul className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
              {cart.map((item) => (
                <li key={item.productId} className="flex gap-3">
                  <ProductImage
                    image={item.image}
                    emoji={item.emoji}
                    alt={item.name}
                    sizes="72px"
                    className="h-[72px] w-[72px] shrink-0 rounded-xl text-2xl"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="font-heading text-sm leading-snug"
                        style={{ color: "#2a1f16" }}
                      >
                        {item.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Remove ${item.name}`}
                        className="text-xs transition-colors hover:text-[#c0563d]"
                        style={{ color: "#8a7c6a" }}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-1 text-xs" style={{ color: "#8a7c6a" }}>
                      {formatPrice(item.price, currency)} each
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.name}`}
                          onClick={() =>
                            updateQty(item.productId, item.quantity - 1)
                          }
                          className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold transition-colors hover:bg-[#e6dccb]"
                          style={{ background: "#efe4d2" }}
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.name}`}
                          onClick={() =>
                            updateQty(item.productId, item.quantity + 1)
                          }
                          className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold transition-colors hover:bg-[#e6dccb]"
                          style={{ background: "#efe4d2" }}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-bold" style={{ color: "#c0563d" }}>
                        {formatPrice(item.price * item.quantity, currency)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div
              className="space-y-3 px-5 py-4"
              style={{ borderTop: "1px solid #e6dccb" }}
            >
              <div className="flex justify-between text-sm">
                <span style={{ color: "#6b5d4f" }}>Subtotal</span>
                <span className="font-bold" style={{ color: "#2a1f16" }}>
                  {formatPrice(subtotal, currency)}
                </span>
              </div>
              <p className="text-xs" style={{ color: "#8a7c6a" }}>
                Shipping calculated at checkout
              </p>
              <Link
                href="/checkout"
                onClick={onClose}
                className="block rounded-full py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#a3442e]"
                style={{ background: "#c0563d" }}
              >
                Proceed to Checkout →
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className="block text-center text-xs underline"
                style={{ color: "#6b5d4f" }}
              >
                View full cart
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
