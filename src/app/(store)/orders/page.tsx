import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";
import { formatPrice } from "@/lib/utils";
import { NoStore } from "@/components/store/no-store";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  DELIVERED: "text-green-600",
  SHIPPED: "text-blue-600",
  PROCESSING: "text-yellow-600",
  CANCELLED: "text-destructive",
  PENDING: "text-muted-foreground",
};

export default async function OrdersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenant = await getCurrentTenant();
  if (!tenant) return <NoStore />;

  const orders = await prisma.order.findMany({
    where: {
      tenantId: tenant.id,
      email: session.user.email ?? undefined,
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: { select: { id: true } },
    },
  });

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/account" className="hover:text-foreground">
          My Account
        </Link>
        {" / "}
        <span className="text-foreground">Orders</span>
      </nav>

      <h1 className="font-heading text-4xl font-bold italic">My Orders</h1>

      {orders.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-lg text-muted-foreground">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/shop"
            className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Order #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="mt-1 text-lg font-bold">
                    {formatPrice(order.total, order.currency)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`text-sm font-semibold ${STATUS_COLOR[order.status] ?? "text-muted-foreground"}`}
                  >
                    {order.status}
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
