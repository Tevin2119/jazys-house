import { notFound, redirect } from "next/navigation";
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
    where: {
      id,
      tenantId: tenant.id,
      email: session.user.email ?? undefined,
    },
    include: {
      items: {
        include: {
          product: {
            select: { name: true, slug: true, images: true, emoji: true },
          },
        },
      },
    },
  });

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-[800px] px-6 py-12">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/account" className="hover:text-foreground">
          My Account
        </Link>
        {" / "}
        <Link href="/orders" className="hover:text-foreground">
          Orders
        </Link>
        {" / "}
        <span className="text-foreground">#{order.id.slice(-8).toUpperCase()}</span>
      </nav>

      <h1 className="font-heading text-4xl font-bold italic">
        Order #{order.id.slice(-8).toUpperCase()}
      </h1>

      <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4 rounded-xl border border-border bg-card p-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
          <p className={`mt-1 font-semibold ${STATUS_COLOR[order.status] ?? ""}`}>
            {order.status}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Date</p>
          <p className="mt-1 font-semibold">
            {new Date(order.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="mt-1 font-semibold">{formatPrice(order.total, order.currency)}</p>
        </div>
        {order.name && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Name</p>
            <p className="mt-1 font-semibold">{order.name}</p>
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Items</h2>
        <div className="mt-4 flex flex-col gap-3">
          {order.items.map((item) => {
            const thumb = item.product.images[0] ?? null;
            return (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-2xl">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{item.product.emoji ?? "📦"}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/shop/${item.product.slug}`}
                    className="font-medium hover:text-primary"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="shrink-0 font-semibold">
                  {formatPrice(item.price * item.quantity, order.currency)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {order.address ? (
        <div className="mt-10">
          <h2 className="text-lg font-semibold">Shipping Address</h2>
          <div className="mt-3 rounded-xl border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground">
            {formatAddress(order.address)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatAddress(raw: unknown): string {
  if (typeof raw !== "object" || raw === null) return String(raw);
  const a = raw as Record<string, unknown>;
  return [a.line1, a.line2, a.city, a.state, a.postalCode, a.country]
    .filter(Boolean)
    .join(", ");
}
