import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";
import { formatPrice } from "@/lib/utils";
import { NoStore } from "@/components/store/no-store";
import { LanguageSwitcher } from "@/components/store/language-switcher";
import { getLangFromCookies, formatJapaneseAddress } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenant = await getCurrentTenant();
  if (!tenant) return <NoStore />;

  const cookieStore = await cookies();
  const lang: Lang = getLangFromCookies(cookieStore);

  const [orders, wishlistCount, lastOrderWithAddr] = await Promise.all([
    prisma.order.findMany({
      where: { tenantId: tenant.id, email: session.user.email ?? undefined },
      select: { total: true, currency: true },
    }),
    prisma.wishlistItem.count({
      where: { tenantId: tenant.id, userId: session.user.id },
    }),
    prisma.order.findFirst({
      where: {
        tenantId: tenant.id,
        email: session.user.email ?? undefined,
      },
      orderBy: { createdAt: "desc" },
      select: { address: true },
    }),
  ]);

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
  const currency = orders[0]?.currency ?? tenant.currency;

  const savedAddr =
    lastOrderWithAddr?.address &&
    typeof lastOrderWithAddr.address === "object" &&
    !Array.isArray(lastOrderWithAddr.address)
      ? (lastOrderWithAddr.address as Record<string, unknown>)
      : null;

  return (
    <div className="mx-auto max-w-[800px] px-6 py-12">
      <h1 className="font-heading text-4xl font-bold italic">
        {lang === "ja" ? "マイアカウント" : "My Account"}
      </h1>

      {/* ── Profile ─────────────────────────────────────────────── */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <dl className="flex flex-col gap-4">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              {lang === "ja" ? "お名前" : "Name"}
            </dt>
            <dd className="mt-0.5 font-medium">{session.user.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              {lang === "ja" ? "メールアドレス" : "Email"}
            </dt>
            <dd className="mt-0.5 font-medium">{session.user.email}</dd>
          </div>
        </dl>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatCard
          label={lang === "ja" ? "注文数" : "Orders"}
          value={String(orders.length)}
          href="/orders"
        />
        <StatCard
          label={lang === "ja" ? "合計購入額" : "Total Spent"}
          value={formatPrice(totalSpent, currency)}
          href="/orders"
        />
        <StatCard
          label={lang === "ja" ? "お気に入り" : "Wishlist"}
          value={`${wishlistCount}`}
          href="/wishlist"
        />
      </div>

      {/* ── Quick links ──────────────────────────────────────────── */}
      <div className="mt-8 flex flex-col gap-3">
        <AccountLink href="/orders"   label={lang === "ja" ? "注文履歴" : "Order History"} />
        <AccountLink href="/wishlist" label={lang === "ja" ? "お気に入り" : "Wishlist"} />
      </div>

      {/* ── Saved address ────────────────────────────────────────── */}
      {savedAddr && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">
            {lang === "ja" ? "お届け先住所（直近の注文より）" : "Shipping Address (from last order)"}
          </h2>
          <div className="rounded-xl border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground">
            {formatJapaneseAddress(savedAddr)}
          </div>
        </section>
      )}

      {/* ── Language preference ──────────────────────────────────── */}
      <section className="mt-10">
        <h2 className="mb-1 text-lg font-semibold">
          {lang === "ja" ? "言語設定" : "Language"}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {lang === "ja"
            ? "サイトの表示言語を選択してください。"
            : "Choose your preferred display language."}
        </p>
        <LanguageSwitcher current={lang} />
      </section>

      {/* ── Payment preference (coming soon) ────────────────────── */}
      <section className="mt-10">
        <h2 className="mb-1 text-lg font-semibold">
          {lang === "ja" ? "お支払い設定" : "Payment Preferences"}
        </h2>
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
          {lang === "ja"
            ? "デフォルトのお支払い方法の保存は近日公開予定です。"
            : "Saved payment method preferences coming soon."}
        </div>
      </section>

      {/* ── Notification preferences (coming soon) ──────────────── */}
      <section className="mt-10">
        <h2 className="mb-1 text-lg font-semibold">
          {lang === "ja" ? "通知設定" : "Notifications"}
        </h2>
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
          {lang === "ja"
            ? "注文更新・配送通知などの設定は近日公開予定です。"
            : "Order and shipping notification preferences coming soon."}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xl font-bold">{value}</p>
    </Link>
  );
}

function AccountLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 transition-shadow hover:shadow-sm"
    >
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground" aria-hidden>→</span>
    </Link>
  );
}
