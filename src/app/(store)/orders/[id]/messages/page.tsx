import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";
import { NoStore } from "@/components/store/no-store";
import { sendCustomerMessage } from "./actions";

export const dynamic = "force-dynamic";

export default async function OrderMessagesPage({
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
    select: { id: true, tenantId: true, name: true, email: true },
  });
  if (!order) notFound();

  const messages = await prisma.orderMessage.findMany({
    where: { orderId: id, tenantId: tenant.id, isInternal: false },
    orderBy: { createdAt: "asc" },
  });

  const senderName = order.name ?? session.user.name ?? session.user.email ?? "Customer";
  const boundSend = sendCustomerMessage.bind(null, order.id, tenant.id, senderName);

  return (
    <div className="mx-auto max-w-[700px] px-6 py-12">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/account" className="hover:text-foreground">マイアカウント</Link>
        {" / "}
        <Link href="/orders" className="hover:text-foreground">注文履歴</Link>
        {" / "}
        <Link href={`/orders/${order.id}`} className="hover:text-foreground">
          #{order.id.slice(-8).toUpperCase()}
        </Link>
        {" / "}
        <span className="text-foreground">メッセージ</span>
      </nav>

      <h1 className="font-heading text-3xl font-bold italic">お問い合わせ</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        注文 #{order.id.slice(-8).toUpperCase()} に関するメッセージ
      </p>

      {/* ── Thread ──────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            まだメッセージはありません。下のフォームからご連絡ください。
          </p>
        )}

        {messages.map((msg) => {
          const isStore = msg.side === "STORE";
          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 ${isStore ? "items-start" : "items-end"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isStore
                    ? "rounded-tl-none bg-muted text-foreground"
                    : "rounded-tr-none bg-primary text-primary-foreground"
                }`}
              >
                {msg.content}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {isStore ? "ショップ" : msg.senderName}
                {" · "}
                {new Date(msg.createdAt).toLocaleString("ja-JP", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Send form ─────────────────────────────────────────────── */}
      <form action={boundSend} className="mt-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <textarea
            name="content"
            required
            rows={4}
            placeholder="ご質問・ご要望をご記入ください..."
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              送信
            </button>
          </div>
        </div>
      </form>

      <div className="mt-4 text-center">
        <Link
          href={`/orders/${order.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 注文詳細に戻る
        </Link>
      </div>
    </div>
  );
}
