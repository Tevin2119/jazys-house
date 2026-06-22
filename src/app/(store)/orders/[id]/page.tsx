import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";
import { formatPrice } from "@/lib/utils";
import { NoStore } from "@/components/store/no-store";
import { ORDER_STATUS_LABEL, TIMELINE_STATUSES, formatJapaneseAddress } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const TIMELINE_META: Record<string, { icon: string; ja: string }> = {
  PENDING:       { icon: "📦", ja: "注文受付"   },
  PROCESSING:    { icon: "⚙️",  ja: "処理中"     },
  LABEL_CREATED: { icon: "🏷️", ja: "ラベル作成済" },
  SHIPPED:       { icon: "🚚", ja: "発送済み"   },
  IN_TRANSIT:    { icon: "📬", ja: "配達中"     },
  DELIVERED:     { icon: "✅", ja: "配達完了"   },
};

const CARRIER_LABEL: Record<string, string> = {
  YAMATO:    "ヤマト運輸",
  SAGAWA:    "佐川急便",
  JAPAN_POST: "日本郵便",
  OTHER:     "その他",
};

const CARRIER_URL: Record<string, (n: string) => string> = {
  YAMATO:     (n) => `https://jizen.kuronekoyamato.co.jp/jizen/servlet/crjz.b.NQ0010?id=${n}`,
  SAGAWA:     (n) => `https://k2k.sagawa-exp.co.jp/p/sagawa/web/okurijoinput.jsp?okurijoNo=${n}`,
  JAPAN_POST: (n) => `https://trackings.post.japanpost.jp/services/srv/search/?requestNo1=${n}`,
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const tenant = await getCurrentTenant();
  if (!tenant) return <NoStore />;

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, tenantId: tenant.id, email: session.user.email ?? undefined },
    include: {
      items: {
        include: {
          product: { select: { name: true, slug: true, images: true, emoji: true } },
        },
      },
      shipments: {
        orderBy: { createdAt: "desc" },
        include: { events: { orderBy: { timestamp: "desc" }, take: 1 } },
      },
    },
  });

  if (!order) notFound();

  const currentTimelineIdx = TIMELINE_STATUSES.indexOf(order.status as (typeof TIMELINE_STATUSES)[number]);
  const isCancelled = order.status === "CANCELLED";
  const isRefunded  = order.status === "REFUNDED";
  const showTimeline = currentTimelineIdx >= 0;

  const latestShipment = order.shipments[0] ?? null;
  const statusLabel = ORDER_STATUS_LABEL[order.status];

  const addr =
    order.address && typeof order.address === "object" && !Array.isArray(order.address)
      ? (order.address as Record<string, unknown>)
      : null;

  return (
    <div className="mx-auto max-w-[800px] px-6 py-12">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/account" className="hover:text-foreground">マイアカウント</Link>
        {" / "}
        <Link href="/orders" className="hover:text-foreground">注文履歴</Link>
        {" / "}
        <span className="text-foreground">#{order.id.slice(-8).toUpperCase()}</span>
      </nav>

      <h1 className="font-heading text-4xl font-bold italic">
        注文 #{order.id.slice(-8).toUpperCase()}
      </h1>

      {/* ── Status card ─────────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4 rounded-xl border border-border bg-card p-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">ステータス</p>
          <p className="mt-1 font-semibold">{statusLabel?.ja ?? order.status}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">注文日</p>
          <p className="mt-1 font-semibold">
            {new Date(order.createdAt).toLocaleDateString("ja-JP", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">合計</p>
          <p className="mt-1 font-semibold">{formatPrice(order.total, order.currency)}</p>
        </div>
        {order.paymentMethod && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">お支払い</p>
            <p className="mt-1 font-semibold capitalize">{order.paymentMethod.replace(/_/g, " ")}</p>
          </div>
        )}
      </div>

      {/* ── Delivery timeline ──────────────────────────────────────── */}
      {showTimeline && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">配送状況</h2>
          <ol className="flex items-start">
            {TIMELINE_STATUSES.map((status, i) => {
              const isDone    = i < currentTimelineIdx;
              const isCurrent = i === currentTimelineIdx;
              const meta = TIMELINE_META[status];
              return (
                <li key={status} className="flex flex-1 flex-col items-center">
                  <div className="relative flex w-full items-center">
                    {i > 0 && (
                      <div className={`h-0.5 flex-1 ${i <= currentTimelineIdx ? "bg-green-500" : "bg-border"}`} />
                    )}
                    <div className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2 ring-background ${
                      isDone    ? "bg-green-500 text-white" :
                      isCurrent ? "bg-primary text-primary-foreground ring-primary/30" :
                                  "bg-muted text-muted-foreground"
                    }`}>
                      {isDone ? "✓" : <span>{meta?.icon}</span>}
                    </div>
                    {i < TIMELINE_STATUSES.length - 1 && (
                      <div className={`h-0.5 flex-1 ${isDone ? "bg-green-500" : "bg-border"}`} />
                    )}
                  </div>
                  <p className={`mt-2 px-1 text-center text-[10px] font-medium leading-tight ${
                    isCurrent ? "text-primary" :
                    isDone    ? "text-green-600" :
                                "text-muted-foreground"
                  }`}>
                    {meta?.ja}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {(isCancelled || isRefunded) && (
        <div className={`mt-10 rounded-lg border p-4 text-sm font-medium ${
          isCancelled ? "border-destructive/40 bg-destructive/5 text-destructive" :
                        "border-yellow-400/40 bg-yellow-50 text-yellow-700"
        }`}>
          {isCancelled ? "この注文はキャンセルされました。" : "この注文は返金処理済みです。"}
        </div>
      )}

      {/* ── Tracking info ──────────────────────────────────────────── */}
      {latestShipment && latestShipment.trackingNumber && (
        <div className="mt-8 rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold">追跡情報</h2>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              配送会社: <strong className="text-foreground">{CARRIER_LABEL[latestShipment.carrier] ?? latestShipment.carrier}</strong>
            </span>
            <span className="text-muted-foreground">
              追跡番号: <strong className="font-mono text-foreground">{latestShipment.trackingNumber}</strong>
            </span>
            {CARRIER_URL[latestShipment.carrier] && (
              <a
                href={CARRIER_URL[latestShipment.carrier]!(latestShipment.trackingNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                荷物を追跡する →
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Items ─────────────────────────────────────────────────── */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold">注文商品</h2>
        <div className="mt-4 flex flex-col gap-3">
          {order.items.map((item) => {
            const thumb = item.product.images[0] ?? null;
            return (
              <div key={item.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-2xl">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={item.product.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{item.product.emoji ?? "📦"}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/shop/${item.product.slug}`} className="font-medium hover:text-primary">
                    {item.product.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">数量: {item.quantity}</p>
                </div>
                <p className="shrink-0 font-semibold">
                  {formatPrice(item.price * item.quantity, order.currency)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card px-5 py-3 text-sm">
          {order.subtotal > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">小計</span>
              <span>{formatPrice(order.subtotal, order.currency)}</span>
            </div>
          )}
          {order.shippingTotal > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">送料</span>
              <span>{formatPrice(order.shippingTotal, order.currency)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <span>合計</span>
            <span className="text-primary">{formatPrice(order.total, order.currency)}</span>
          </div>
        </div>
      </div>

      {/* ── Shipping address ──────────────────────────────────────── */}
      {addr && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold">お届け先住所</h2>
          <div className="mt-3 rounded-xl border border-border bg-card p-5 text-sm leading-loose text-muted-foreground">
            {formatJapaneseAddress(addr)}
          </div>
        </div>
      )}

      {/* ── Contact button ────────────────────────────────────────── */}
      <div className="mt-10 flex justify-center">
        <Link
          href={`/orders/${order.id}/messages`}
          className="rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary"
        >
          💬 この注文についてお問い合わせ
        </Link>
      </div>
    </div>
  );
}
