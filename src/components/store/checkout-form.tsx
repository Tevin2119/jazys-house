"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { CART_EVENT, cartSubtotal, getCart, type CartItem } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import { placeOrder, type CheckoutState } from "@/app/(store)/checkout/actions";
import { capturePostHogEvent } from "@/lib/posthog";
import { PREFECTURES } from "@/lib/i18n";

type PaymentMethod = "card" | "paypay" | "konbini" | "bank_transfer" | "rakuten_pay";

interface PaymentOption {
  id: PaymentMethod;
  icon: string;
  name: string;
  description: string;
  available: boolean;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: "card",          icon: "💳", name: "クレジット/デビットカード", description: "Visa · Mastercard · JCB · Amex",                        available: true  },
  { id: "paypay",        icon: "📱", name: "PayPay",                   description: "QRコード決済 — 5,000万人以上が利用",                   available: false },
  { id: "konbini",       icon: "🏪", name: "コンビニ払い",             description: "セブン-イレブン · ローソン · ファミリーマート",           available: false },
  { id: "bank_transfer", icon: "🏦", name: "銀行振込 (振込)",          description: "ネットバンキング · ATM振込",                            available: false },
  { id: "rakuten_pay",   icon: "🏷️", name: "楽天ペイ",                description: "楽天ポイント利用可",                                    available: false },
];

interface ZipcloudResult {
  address1: string;
  address2: string;
  address3: string;
}

const INITIAL: CheckoutState = { ok: false };

const fieldCls =
  "w-full rounded-md border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

export function CheckoutForm({ currency }: { currency: string }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [state, action, pending] = useActionState(placeOrder, INITIAL);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [postalCode, setPostalCode] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [city, setCity] = useState("");
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState("");

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

  useEffect(() => {
    if (state.ok && state.url) {
      setRedirecting(true);
      window.location.href = state.url;
    }
    if (state.ok && state.orderId) {
      setRedirecting(true);
      window.location.href = `/checkout/confirmation?orderId=${state.orderId}`;
    }
  }, [state.ok, state.url, state.orderId]);

  async function lookupPostalCode() {
    const clean = postalCode.replace(/[^0-9]/g, "");
    if (clean.length !== 7) { setZipError("郵便番号は7桁で入力してください"); return; }
    setZipLoading(true);
    setZipError("");
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${clean}`);
      const data = (await res.json()) as { status: number; results: ZipcloudResult[] | null };
      if (data.status === 200 && data.results?.[0]) {
        const r = data.results[0];
        setPrefecture(r.address1);
        setCity(r.address2 + r.address3);
      } else {
        setZipError("住所が見つかりませんでした");
      }
    } catch {
      setZipError("住所検索に失敗しました");
    } finally {
      setZipLoading(false);
    }
  }

  if (!ready) return null;

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mb-4 text-6xl">🛒</div>
        <h2 className="font-heading text-2xl font-bold italic">カートが空です</h2>
        <p className="mt-2 text-muted-foreground">先にショップで商品をカートに入れてください。</p>
        <Link href="/shop" className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--accent-hover)]">
          ショップへ →
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(cart);
  const cartPayload = JSON.stringify(cart.map((i) => ({ productId: i.productId, quantity: i.quantity })));

  const submitLabel = redirecting
    ? "処理中…"
    : pending
      ? "注文処理中…"
      : paymentMethod === "card"
        ? "カードで支払う"
        : "注文を確定する";

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <form
        action={action}
        onSubmit={() => capturePostHogEvent("checkout_started", { items_count: cart.length, subtotal })}
        className="grid gap-8"
      >
        <input type="hidden" name="cart" value={cartPayload} />
        <input type="hidden" name="paymentMethod" value={paymentMethod} />

        {/* ── お名前 ───────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 font-heading text-xl font-bold italic">お名前</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">姓（せい）</span>
              <input name="lastName" required placeholder="山田" className={fieldCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">名（めい）</span>
              <input name="firstName" required placeholder="花子" className={fieldCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">セイ（フリガナ）</span>
              <input name="lastNameKana" placeholder="ヤマダ" className={fieldCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">メイ（フリガナ）</span>
              <input name="firstNameKana" placeholder="ハナコ" className={fieldCls} />
            </label>
          </div>
        </section>

        {/* ── 連絡先 ────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 font-heading text-xl font-bold italic">連絡先</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">メールアドレス</span>
              <input name="email" type="email" required placeholder="example@email.com" className={fieldCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">電話番号</span>
              <input name="phone" type="tel" required placeholder="09012345678" className={fieldCls} />
            </label>
          </div>
        </section>

        {/* ── お届け先住所 ────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 font-heading text-xl font-bold italic">お届け先住所</h2>
          <div className="grid gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">〒 郵便番号</span>
              <div className="flex gap-2">
                <input
                  name="postalCode"
                  required
                  placeholder="1234567"
                  maxLength={8}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className={`${fieldCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={lookupPostalCode}
                  disabled={zipLoading}
                  className="shrink-0 rounded-md bg-secondary px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary/80 disabled:opacity-60"
                >
                  {zipLoading ? "検索中…" : "住所検索"}
                </button>
              </div>
              {zipError && <p className="text-xs text-destructive">{zipError}</p>}
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">都道府県</span>
              <select
                name="prefecture"
                required
                value={prefecture}
                onChange={(e) => setPrefecture(e.target.value)}
                className={`${fieldCls} bg-card`}
              >
                <option value="">選択してください</option>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">市区町村</span>
              <input
                name="city"
                required
                placeholder="渋谷区"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={fieldCls}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">町名・番地</span>
              <input name="addressLine1" required placeholder="神南1-2-3" className={fieldCls} />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">建物名・部屋番号（任意）</span>
              <input name="addressLine2" placeholder="○○マンション 101号" className={fieldCls} />
            </label>
          </div>
        </section>

        {/* ── お支払い方法 ────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 font-heading text-xl font-bold italic">お支払い方法</h2>
          <div className="grid gap-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className={`relative flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
                  !opt.available
                    ? "cursor-not-allowed border-border opacity-50"
                    : paymentMethod === opt.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                }`}
              >
                <input
                  type="radio"
                  name="_paymentRadio"
                  value={opt.id}
                  checked={paymentMethod === opt.id}
                  disabled={!opt.available}
                  onChange={() => opt.available && setPaymentMethod(opt.id)}
                  className="sr-only"
                />
                <span className="text-2xl" aria-hidden>{opt.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{opt.name}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
                {opt.available && paymentMethod === opt.id && (
                  <span className="text-primary font-bold" aria-hidden>✓</span>
                )}
                {!opt.available && (
                  <span className="shrink-0 text-xs text-muted-foreground">近日公開</span>
                )}
              </label>
            ))}
          </div>
        </section>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <button
          type="submit"
          disabled={pending || redirecting}
          className="w-full rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-70"
        >
          {submitLabel}
        </button>
        {paymentMethod === "card" && (
          <p className="text-center text-xs text-muted-foreground">
            Stripeの安全な決済ページへリダイレクトします。
          </p>
        )}
      </form>

      {/* ── Order summary ─────────────────────────────────────────── */}
      <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-xl font-bold italic">注文内容</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {cart.map((item) => (
            <li key={item.productId} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
              <span className="font-medium">{formatPrice(item.price * item.quantity, currency)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">小計</span>
            <span className="font-bold text-primary">{formatPrice(subtotal, currency)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-muted-foreground">送料</span>
            <span className="text-muted-foreground">別途計算</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
