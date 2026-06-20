import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";
import { formatPrice } from "@/lib/utils";
import { NoStore } from "@/components/store/no-store";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenant = await getCurrentTenant();
  if (!tenant) return <NoStore />;

  const [orders, wishlistCount] = await Promise.all([
    prisma.order.findMany({
      where: { tenantId: tenant.id, email: session.user.email ?? undefined },
      select: { total: true, currency: true },
    }),
    prisma.wishlistItem.count({
      where: { tenantId: tenant.id, userId: session.user.id },
    }),
  ]);

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
  const currency = orders[0]?.currency ?? tenant.currency;

  return (
    <div className="mx-auto max-w-[800px] px-6 py-12">
      <h1 className="font-heading text-4xl font-bold italic">My Account</h1>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <dl className="flex flex-col gap-4">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Name</dt>
            <dd className="mt-0.5 font-medium">{session.user.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Email</dt>
            <dd className="mt-0.5 font-medium">{session.user.email}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatCard label="Orders" value={String(orders.length)} href="/orders" />
        <StatCard label="Total Spent" value={formatPrice(totalSpent, currency)} href="/orders" />
        <StatCard label="Wishlist" value={`${wishlistCount}`} href="/wishlist" />
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <AccountLink href="/orders" label="Order History" />
        <AccountLink href="/wishlist" label="Wishlist" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
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
      <span className="text-muted-foreground" aria-hidden>
        →
      </span>
    </Link>
  );
}
