/**
 * Cart logic — localStorage-backed, client-side only.
 *
 * The storefront cart lives entirely in the browser until checkout, when the
 * line items are POSTed to a server action that re-verifies every price against
 * the DB (see `verifyCart` in lib/stripe.ts). NEVER trust the prices stored here
 * for anything financial — they exist only to render the cart UI.
 *
 * This module is intentionally framework-free (no "use client"/"server-only") so
 * it can be imported by any Client Component. Every function is SSR-safe: it
 * no-ops when `window` is undefined.
 */

const CART_KEY = "jazyshouse_cart";

/** Emitted on the window whenever the cart changes, so the nav badge can sync. */
export const CART_EVENT = "jazyshouse:cart";

export interface CartItem {
  productId: string;
  name: string;
  /** Unit price in minor units (pence) — display only, re-verified at checkout. */
  price: number;
  quantity: number;
  /** First product image path, or null when only an emoji is available. */
  image: string | null;
  /** Emoji fallback glyph for products without imagery. */
  emoji: string | null;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getCart(): CartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function save(cart: CartItem[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

/** Add an item (or increment its quantity if already present). */
export function addItem(item: Omit<CartItem, "quantity">, quantity = 1): void {
  const cart = getCart();
  const existing = cart.find((i) => i.productId === item.productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...item, quantity });
  }
  save(cart);
}

export function removeItem(productId: string): void {
  save(getCart().filter((i) => i.productId !== productId));
}

/** Set an absolute quantity; removes the line when quantity drops to 0 or below. */
export function updateQty(productId: string, quantity: number): void {
  const cart = getCart();
  const item = cart.find((i) => i.productId === productId);
  if (!item) return;
  if (quantity <= 0) {
    save(cart.filter((i) => i.productId !== productId));
    return;
  }
  item.quantity = quantity;
  save(cart);
}

export function clearCart(): void {
  save([]);
}

export function cartCount(cart: CartItem[] = getCart()): number {
  return cart.reduce((sum, i) => sum + i.quantity, 0);
}

/** Subtotal in minor units (pence). */
export function cartSubtotal(cart: CartItem[] = getCart()): number {
  return cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
}
