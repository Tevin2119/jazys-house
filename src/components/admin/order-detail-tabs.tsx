"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { formatPrice } from "@/lib/utils";
import { sendOrderMessage, createShipment } from "@/app/(admin)/admin/orders/[id]/actions";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { OrderStatusChanger } from "@/components/admin/order-status-changer";

// ── Serialised types (Date → string) for safe client-component props ──

type ItemData = {
  id: string;
  productName: string;
  quantity: number;
  price: number;
};

type ShipmentEventData = {
  id: string;
  status: string;
  location: string | null;
  description: string | null;
  timestamp: string;
};

type ShipmentData = {
  id: string;
  carrier: string;
  trackingNumber: string | null;
  status: string;
  createdAt: string;
  events: ShipmentEventData[];
};

type MessageData = {
  id: string;
  content: string;
  side: string;
  senderName: string;
  isInternal: boolean;
  createdAt: string;
};

type StatusLogData = {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  changedBy: string | null;
  createdAt: string;
};

export type OrderDetailData = {
  id: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  shippingTotal: number;
  currency: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  address: unknown;
  stripeSessionId: string | null;
  paymentProvider: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  isPaid: boolean;
  hasSession: boolean;
  items: ItemData[];
  shipments: ShipmentData[];
  messages: MessageData[];
  statusLogs: StatusLogData[];
};

type TabId = "summary" | "shipping" | "messages" | "history";

const TABS: { id: TabId; label: string }[] = [
  { id: "summary",  label: "概要" },
  { id: "shipping", label: "配送" },
  { id: "messages", label: "メッセージ" },
  { id: "history",  label: "履歴" },
];

const CARRIER_LABELS: Record<string, string> = {
  YAMATO:     "ヤマト運輸",
  SAGAWA:     "佐川急便",
  JAPAN_POST: "日本郵便",
  OTHER:      "その他",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    month: "short",
    day:   "numeric",
    hour:  "2-digit",
    minute: "2-digit",
  });
}

// ── Japanese address ──────────────────────────────────────────────────

function JapaneseAddress({ address }: { address: unknown }) {
  if (!address || typeof address !== "object" || Array.isArray(address)) {
    return <p style={{ fontSize: 13, color: "#8a7c6a" }}>住所なし</p>;
  }
  const a = address as Record<string, unknown>;
  const postal     = String(a.postalCode ?? a.postcode ?? "");
  const prefecture = String(a.prefecture ?? "");
  const city       = String(a.city ?? "");
  const line1      = String(a.line1 ?? a.address ?? "");
  const line2      = String(a.line2 ?? "");
  const kana       = String(a.kana ?? a.nameKana ?? "");

  if (!postal && !prefecture && !city && !line1) {
    return <p style={{ fontSize: 13, color: "#8a7c6a" }}>住所なし</p>;
  }

  return (
    <div style={{ fontSize: 13, lineHeight: 1.7, color: "#2a1f16" }}>
      {postal && <div>〒{postal}</div>}
      {(prefecture || city) && <div>{prefecture}{city}</div>}
      {line1 && <div>{line1}</div>}
      {line2 && <div>{line2}</div>}
      {kana && <div style={{ color: "#8a7c6a", fontSize: 11 }}>{kana}</div>}
    </div>
  );
}

// ── Card wrapper ───────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#fffdf9",
      border: "1px solid #ece2d2",
      borderRadius: 12,
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 16 }}>
      <div style={{
        fontSize: 10,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: "#a39685",
        fontWeight: 700,
        marginBottom: 10,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Summary tab ────────────────────────────────────────────────────────

function PaymentBadge({ hasSession, isPaid }: { hasSession: boolean; isPaid: boolean }) {
  const { label, bg, color } = isPaid
    ? { label: "支払済", bg: "#d8ecd9", color: "#2f6b3a" }
    : hasSession
    ? { label: "支払待ち", bg: "#fbe5cf", color: "#9a6b1e" }
    : { label: "支払なし", bg: "#f0e8da", color: "#8a7c6a" };
  return (
    <span style={{ background: bg, color, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
      {label}
    </span>
  );
}

function SummaryTab({
  order,
  nextOptions,
}: {
  order: OrderDetailData;
  nextOptions: OrderStatus[];
}) {
  const showBreakdown = order.subtotal > 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
      <div style={{ display: "grid", gap: 20 }} className="lg:grid-cols-3">
        {/* Items table */}
        <div className="lg:col-span-2">
          <Card>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0e8da" }}>
              <span style={{ fontFamily: "'Marcellus', serif", fontSize: 15, fontWeight: 400 }}>注文商品</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#a39685" }}>
                  <th style={{ padding: "10px 20px", textAlign: "left", fontWeight: 700 }}>商品</th>
                  <th style={{ padding: "10px 8px", textAlign: "right", fontWeight: 700 }}>数量</th>
                  <th style={{ padding: "10px 8px", textAlign: "right", fontWeight: 700 }}>単価</th>
                  <th style={{ padding: "10px 20px 10px 8px", textAlign: "right", fontWeight: 700 }}>小計</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} style={{ borderTop: "1px solid #f4ecde" }}>
                    <td style={{ padding: "11px 20px", fontSize: 14, fontWeight: 500 }}>{item.productName}</td>
                    <td style={{ padding: "11px 8px", textAlign: "right", fontSize: 14, color: "#6b5d4f" }}>{item.quantity}</td>
                    <td style={{ padding: "11px 8px", textAlign: "right", fontSize: 14, color: "#6b5d4f" }}>
                      {formatPrice(item.price, order.currency)}
                    </td>
                    <td style={{ padding: "11px 20px 11px 8px", textAlign: "right", fontSize: 14, fontWeight: 600 }}>
                      {formatPrice(item.price * item.quantity, order.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {showBreakdown && (
                  <>
                    <tr style={{ borderTop: "1px solid #f0e8da" }}>
                      <td colSpan={3} style={{ padding: "9px 20px", textAlign: "right", fontSize: 13, color: "#6b5d4f" }}>小計</td>
                      <td style={{ padding: "9px 20px 9px 8px", textAlign: "right", fontSize: 13 }}>
                        {formatPrice(order.subtotal, order.currency)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} style={{ padding: "9px 20px", textAlign: "right", fontSize: 13, color: "#6b5d4f" }}>送料</td>
                      <td style={{ padding: "9px 20px 9px 8px", textAlign: "right", fontSize: 13 }}>
                        {order.shippingTotal === 0 ? "無料" : formatPrice(order.shippingTotal, order.currency)}
                      </td>
                    </tr>
                  </>
                )}
                <tr style={{ borderTop: "2px solid #ece2d2" }}>
                  <td colSpan={3} style={{ padding: "12px 20px", textAlign: "right", fontSize: 14, fontWeight: 700 }}>合計</td>
                  <td style={{ padding: "12px 20px 12px 8px", textAlign: "right", fontSize: 16, fontWeight: 800, color: "#2a1f16" }}>
                    {formatPrice(order.total, order.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </Card>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <CardSection title="顧客">
              <div style={{ fontSize: 15, fontWeight: 600, color: "#2a1f16" }}>{order.name ?? "—"}</div>
              {order.email && <div style={{ fontSize: 13, color: "#6b5d4f", marginTop: 3 }}>{order.email}</div>}
              {order.phone && <div style={{ fontSize: 13, color: "#6b5d4f", marginTop: 2 }}>📞 {order.phone}</div>}
            </CardSection>
          </Card>

          <Card>
            <CardSection title="配送先">
              <JapaneseAddress address={order.address} />
            </CardSection>
          </Card>

          <Card>
            <CardSection title="お支払い">
              <div style={{ marginBottom: 8 }}>
                <PaymentBadge hasSession={order.hasSession} isPaid={order.isPaid} />
              </div>
              {order.paymentMethod && (
                <div style={{ fontSize: 12, color: "#6b5d4f", marginTop: 6 }}>
                  方法: <strong>{order.paymentMethod}</strong>
                </div>
              )}
              {order.paymentProvider && (
                <div style={{ fontSize: 12, color: "#6b5d4f", marginTop: 2 }}>
                  プロバイダ: {order.paymentProvider}
                </div>
              )}
              {order.stripeSessionId && (
                <a
                  href={`https://dashboard.stripe.com/search?query=${order.stripeSessionId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 10, fontFamily: "monospace", color: "#c0563d", wordBreak: "break-all", display: "block", marginTop: 6 }}
                >
                  {order.stripeSessionId}
                </a>
              )}
            </CardSection>
          </Card>

          <Card>
            <CardSection title="ステータス">
              <div style={{ marginBottom: 10 }}>
                <OrderStatusBadge status={order.status} />
              </div>
              <OrderStatusChanger
                id={order.id}
                current={order.status}
                nextOptions={nextOptions}
              />
              {order.status === "PENDING" && !order.isPaid && (
                <p style={{ fontSize: 11, color: "#8a7c6a", marginTop: 8 }}>
                  支払い待ち — Stripe確認後に処理が始まります
                </p>
              )}
            </CardSection>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Shipping tab ───────────────────────────────────────────────────────

function ShippingTab({ order }: { order: OrderDetailData }) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createShipment(fd);
      router.refresh();
      setShowForm(false);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'Marcellus', serif", fontSize: 18, fontWeight: 400 }}>配送</span>
        <button
          onClick={() => setShowForm((s) => !s)}
          style={{
            background: showForm ? "#f5f0ea" : "#c0563d",
            color: showForm ? "#6b5d4f" : "white",
            border: "none",
            borderRadius: 8,
            padding: "7px 16px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {showForm ? "キャンセル" : "+ 新規配送"}
        </button>
      </div>

      {showForm && (
        <Card>
          <div style={{ padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>配送を作成</div>
            <form ref={formRef} onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="hidden" name="orderId" value={order.id} />
              <div>
                <label style={{ fontSize: 12, color: "#6b5d4f", display: "block", marginBottom: 4 }}>配送業者</label>
                <select
                  name="carrier"
                  required
                  style={{ width: "100%", border: "1px solid #e6dccb", borderRadius: 8, padding: "8px 12px", fontSize: 14, background: "white" }}
                >
                  <option value="">選択してください</option>
                  <option value="YAMATO">ヤマト運輸</option>
                  <option value="SAGAWA">佐川急便</option>
                  <option value="JAPAN_POST">日本郵便</option>
                  <option value="OTHER">その他</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6b5d4f", display: "block", marginBottom: 4 }}>追跡番号（任意）</label>
                <input
                  type="text"
                  name="trackingNumber"
                  placeholder="例: 1234-5678-9012"
                  style={{ width: "100%", border: "1px solid #e6dccb", borderRadius: 8, padding: "8px 12px", fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                style={{
                  background: "#c0563d",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 20px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isPending ? "not-allowed" : "pointer",
                  opacity: isPending ? 0.7 : 1,
                  alignSelf: "flex-start",
                }}
              >
                {isPending ? "作成中..." : "配送を作成"}
              </button>
            </form>
          </div>
        </Card>
      )}

      {order.shipments.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#8a7c6a", fontSize: 14 }}>
          配送記録はまだありません
        </div>
      ) : (
        order.shipments.map((shipment) => (
          <Card key={shipment.id}>
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{
                    background: "#f0e8da",
                    color: "#6b5d4f",
                    padding: "3px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                  }}>
                    {CARRIER_LABELS[shipment.carrier] ?? shipment.carrier}
                  </span>
                  {shipment.trackingNumber && (
                    <span style={{ fontSize: 12, fontFamily: "monospace", color: "#2a1f16" }}>
                      {shipment.trackingNumber}
                    </span>
                  )}
                </div>
                <span style={{
                  background: shipment.status === "DELIVERED" ? "#d8ecd9" : "#fbe5cf",
                  color:      shipment.status === "DELIVERED" ? "#2f6b3a" : "#9a6b1e",
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                }}>
                  {shipment.status}
                </span>
              </div>

              {shipment.events.length > 0 && (
                <div style={{ paddingLeft: 12, borderLeft: "2px solid #e6dccb", marginLeft: 4, marginBottom: 10 }}>
                  {shipment.events.map((ev) => (
                    <div key={ev.id} style={{ position: "relative", paddingLeft: 14, marginBottom: 10 }}>
                      <div style={{
                        position: "absolute",
                        left: -8,
                        top: 4,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#c0563d",
                        border: "2px solid white",
                      }} />
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#2a1f16" }}>{ev.status}</div>
                      {ev.location && <div style={{ fontSize: 11, color: "#6b5d4f" }}>{ev.location}</div>}
                      {ev.description && <div style={{ fontSize: 11, color: "#8a7c6a" }}>{ev.description}</div>}
                      <div style={{ fontSize: 10, color: "#a39685", marginTop: 1 }}>
                        {new Date(ev.timestamp).toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 11, color: "#a39685" }}>
                作成: {new Date(shipment.createdAt).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

// ── Messages tab ───────────────────────────────────────────────────────

function MessagesTab({ order }: { order: OrderDetailData }) {
  const [showInternal, setShowInternal] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const visible = order.messages.filter((m) => !m.isInternal || showInternal);

  function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("isInternal", String(isInternal));
    startTransition(async () => {
      await sendOrderMessage(fd);
      router.refresh();
      formRef.current?.reset();
      setIsInternal(false);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'Marcellus', serif", fontSize: 18, fontWeight: 400 }}>メッセージ</span>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b5d4f", cursor: "pointer" }}>
          <input type="checkbox" checked={showInternal} onChange={(e) => setShowInternal(e.target.checked)} />
          内部メモを表示
        </label>
      </div>

      {/* Thread */}
      <Card>
        <div style={{ padding: 16, minHeight: 200, maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.length === 0 ? (
            <div style={{ textAlign: "center", color: "#8a7c6a", fontSize: 13, padding: "40px 0" }}>
              メッセージはまだありません
            </div>
          ) : (
            visible.map((msg) => {
              const isCustomer = msg.side === "CUSTOMER";
              return (
                <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isCustomer ? "flex-start" : "flex-end" }}>
                  <div style={{ fontSize: 10, color: "#a39685", marginBottom: 3 }}>
                    {msg.senderName} · {fmtDate(msg.createdAt)}
                    {msg.isInternal && " · 内部メモ"}
                  </div>
                  <div style={{
                    background: msg.isInternal ? "#fef9c3" : isCustomer ? "#f5f0ea" : "#c0563d",
                    color:      msg.isInternal ? "#7c6800" : isCustomer ? "#2a1f16" : "white",
                    padding: "8px 14px",
                    borderRadius: isCustomer ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                    fontSize: 14,
                    maxWidth: "72%",
                    border: msg.isInternal ? "1px solid #fde68a" : "none",
                  }}>
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Reply form */}
      <Card>
        <div style={{ padding: 16 }}>
          <form ref={formRef} onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input type="hidden" name="orderId" value={order.id} />
            <textarea
              name="content"
              placeholder="メッセージを入力..."
              required
              rows={3}
              style={{
                width: "100%",
                border: "1px solid #e6dccb",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 14,
                resize: "vertical",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b5d4f", cursor: "pointer" }}>
                <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                内部メモ
              </label>
              <button
                type="submit"
                disabled={isPending}
                style={{
                  background: "#c0563d",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 20px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isPending ? "not-allowed" : "pointer",
                  opacity: isPending ? 0.7 : 1,
                }}
              >
                {isPending ? "送信中..." : "送信"}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

// ── History tab ────────────────────────────────────────────────────────

function HistoryTab({ order }: { order: OrderDetailData }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <span style={{ fontFamily: "'Marcellus', serif", fontSize: 18, fontWeight: 400 }}>履歴</span>

      {order.statusLogs.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#8a7c6a", fontSize: 14 }}>
          ステータス履歴はありません
        </div>
      ) : (
        <div style={{ position: "relative", paddingLeft: 28 }}>
          <div style={{ position: "absolute", left: 10, top: 8, bottom: 8, width: 2, background: "#e6dccb" }} />
          {order.statusLogs.map((log, i) => (
            <div key={log.id} style={{ position: "relative", marginBottom: 16 }}>
              <div style={{
                position: "absolute",
                left: -28 + 10 - 6,
                top: 6,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: i === order.statusLogs.length - 1 ? "#c0563d" : "#e6dccb",
                border: "2px solid white",
                boxShadow: "0 0 0 2px #e6dccb",
              }} />
              <Card>
                <div style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 5 }}>
                    {log.oldStatus && (
                      <>
                        <OrderStatusBadge status={log.oldStatus} />
                        <span style={{ color: "#a39685", fontSize: 13 }}>→</span>
                      </>
                    )}
                    <OrderStatusBadge status={log.newStatus} />
                  </div>
                  <div style={{ fontSize: 11, color: "#a39685" }}>
                    {fmtDate(log.createdAt)}
                    {log.changedBy && ` · ${log.changedBy}`}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────

export function OrderDetailTabs({
  order,
  nextOptions,
}: {
  order: OrderDetailData;
  nextOptions: OrderStatus[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [stacked, setStacked] = useState(false);

  return (
    <div>
      {/* Tab bar + layout toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 2, background: "#f5f0ea", borderRadius: 10, padding: 3 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setStacked(false); }}
              style={{
                padding: "7px 18px",
                borderRadius: 8,
                border: "none",
                background: !stacked && activeTab === tab.id ? "white" : "transparent",
                color:      !stacked && activeTab === tab.id ? "#2a1f16" : "#8a7c6a",
                fontWeight: !stacked && activeTab === tab.id ? 700 : 500,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: !stacked && activeTab === tab.id ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setStacked((s) => !s)}
          title={stacked ? "タブ表示に切り替え" : "一覧表示に切り替え"}
          style={{
            background: stacked ? "#c0563d" : "transparent",
            color:      stacked ? "white" : "#8a7c6a",
            border: "1px solid #e6dccb",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {stacked ? "タブ" : "一覧"}
        </button>
      </div>

      {stacked ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <SummaryTab  order={order} nextOptions={nextOptions} />
          <ShippingTab order={order} />
          <MessagesTab order={order} />
          <HistoryTab  order={order} />
        </div>
      ) : (
        <>
          {activeTab === "summary"  && <SummaryTab  order={order} nextOptions={nextOptions} />}
          {activeTab === "shipping" && <ShippingTab order={order} />}
          {activeTab === "messages" && <MessagesTab order={order} />}
          {activeTab === "history"  && <HistoryTab  order={order} />}
        </>
      )}
    </div>
  );
}
