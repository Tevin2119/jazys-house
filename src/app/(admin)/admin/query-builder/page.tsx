export const dynamic = "force-dynamic";

import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { QueryBuilderClient } from "./query-builder-client";

export default async function QueryBuilderPage() {
  const { tenantId } = await getAdminContext();

  const savedQueries = await prisma.savedQuery.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h1
          style={{
            fontFamily: "'Marcellus', serif",
            fontSize: 30,
            margin: "0 0 4px",
            fontWeight: 400,
          }}
        >
          Query Builder
        </h1>
        <p style={{ fontSize: 14, color: "#6b5d4f", margin: 0 }}>
          Explore your store data — select a model, pick fields, add filters, and export.
        </p>
      </div>

      <QueryBuilderClient savedQueries={savedQueries} />
    </div>
  );
}
