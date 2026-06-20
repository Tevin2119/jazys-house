export const dynamic = "force-dynamic";

import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export default async function CustomersPage() {
  const { tenantId } = await getAdminContext();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { currency: true },
  });
  const currency = tenant?.currency ?? "gbp";

  const grouped = await prisma.order.groupBy({
    by: ["email", "name"],
    where: { tenantId, email: { not: null } },
    _count: { id: true },
    _sum: { total: true },
    orderBy: { _sum: { total: "desc" } },
  });

  return (
    <div>
      {/* Page title */}
      <h1
        style={{
          fontFamily: "'Marcellus', serif",
          fontSize: 30,
          margin: "0 0 16px",
          fontWeight: 400,
        }}
      >
        Customers
      </h1>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {grouped.length === 0 ? (
          <p
            style={{
              padding: "40px 0",
              textAlign: "center",
              color: "#8a7c6a",
              fontSize: 14,
            }}
          >
            No customers yet
          </p>
        ) : (
          grouped.map((row) => (
            <div
              key={row.email}
              style={{
                background: "#fffdf9",
                border: "1px solid #ece2d2",
                borderRadius: 12,
                padding: "13px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#2a1f16" }}>
                  {row.name ?? "—"}
                </div>
                <div style={{ fontSize: 12, color: "#6b5d4f" }}>{row.email}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: "#2a1f16" }}>
                  {formatPrice(row._sum.total ?? 0, currency)}
                </div>
                <div style={{ fontSize: 11.5, color: "#6b5d4f" }}>
                  {row._count.id} orders
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div
        className="hidden md:block"
        style={{
          background: "#fffdf9",
          border: "1px solid #ece2d2",
          borderRadius: 13,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1.8fr 0.8fr 1fr",
            padding: "13px 22px",
            fontSize: 11,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#a39685",
            fontWeight: 700,
            borderBottom: "1px solid #f0e8da",
          }}
        >
          <span>Name</span>
          <span>Email</span>
          <span>Orders</span>
          <span>Spent</span>
        </div>

        {grouped.length === 0 ? (
          <div
            style={{
              padding: "40px 22px",
              textAlign: "center",
              color: "#8a7c6a",
              fontSize: 14,
            }}
          >
            No customers yet
          </div>
        ) : (
          grouped.map((row) => (
            <div
              key={row.email}
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1.8fr 0.8fr 1fr",
                padding: "14px 22px",
                fontSize: 14,
                alignItems: "center",
                borderBottom: "1px solid #f4ecde",
              }}
            >
              <span style={{ fontWeight: 600, color: "#2a1f16" }}>
                {row.name ?? <span style={{ color: "#8a7c6a" }}>—</span>}
              </span>
              <span style={{ color: "#6b5d4f" }}>{row.email}</span>
              <span>{row._count.id}</span>
              <span style={{ fontWeight: 700 }}>
                {formatPrice(row._sum.total ?? 0, currency)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
