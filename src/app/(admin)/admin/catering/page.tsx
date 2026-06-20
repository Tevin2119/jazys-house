export const dynamic = "force-dynamic";

import type { Prisma } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CateringStatusSelect } from "@/components/admin/catering-status-select";

function truncate(text: string, max = 120): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  new:       { bg: "#fbe5cf", text: "#9a6b1e", label: "NEW" },
  contacted: { bg: "#d8e6f5", text: "#2f5d8a", label: "CONTACTED" },
  booked:    { bg: "#d8ecd9", text: "#2f6b3a", label: "BOOKED" },
  declined:  { bg: "#f3dad4", text: "#a3442e", label: "DECLINED" },
};

export default async function CateringPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { tenantId } = await getAdminContext();
  const { status } = await searchParams;

  const where: Prisma.CateringInquiryWhereInput = { tenantId };
  if (status && status !== "all") {
    where.status = status;
  }

  const inquiries = await prisma.cateringInquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
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
        Catering Inquiries
      </h1>

      {/* Status filter pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {[
          { value: "all", label: "All" },
          { value: "new", label: "New" },
          { value: "contacted", label: "Contacted" },
          { value: "booked", label: "Booked" },
          { value: "declined", label: "Declined" },
        ].map((opt) => {
          const active = (status ?? "all") === opt.value;
          return (
            <a
              key={opt.value}
              href={opt.value === "all" ? "/admin/catering" : `/admin/catering?status=${opt.value}`}
              style={{
                padding: "7px 16px",
                borderRadius: 999,
                border: "1px solid",
                borderColor: active ? "#c0563d" : "#e6dccb",
                background: active ? "#c0563d" : "#fffdf9",
                color: active ? "#fff" : "#5c4a3a",
                fontSize: 13.5,
                fontWeight: active ? 700 : 600,
                cursor: "pointer",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {opt.label}
            </a>
          );
        })}
      </div>

      {inquiries.length === 0 ? (
        <p
          style={{
            padding: "32px",
            textAlign: "center",
            fontSize: 14,
            color: "#8a7c6a",
            background: "#fffdf9",
            border: "1px dashed #e6dccb",
            borderRadius: 13,
          }}
        >
          No catering inquiries match this view.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 18,
          }}
        >
          {inquiries.map((i) => {
            const badge = STATUS_STYLES[i.status] ?? STATUS_STYLES.new;
            return (
              <div
                key={i.id}
                style={{
                  background: "#fffdf9",
                  border: "1px solid #ece2d2",
                  borderRadius: 13,
                  padding: "20px 22px",
                }}
              >
                {/* Card header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "'Marcellus', serif",
                        fontSize: 19,
                        color: "#2a1f16",
                      }}
                    >
                      {i.name}
                    </div>
                    {i.package ? (
                      <div
                        style={{
                          fontSize: 13,
                          color: "#a3442e",
                          fontWeight: 700,
                          marginTop: 2,
                        }}
                      >
                        {i.package}
                      </div>
                    ) : null}
                  </div>
                  <span
                    style={{
                      background: badge.bg,
                      color: badge.text,
                      padding: "4px 11px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Guests + date */}
                <div
                  style={{
                    display: "flex",
                    gap: 18,
                    fontSize: 13,
                    color: "#6b5d4f",
                    marginBottom: 12,
                  }}
                >
                  <span>👥 {i.guests} guests</span>
                  <span>📅 {i.date}</span>
                </div>

                {/* Message */}
                <p
                  style={{
                    fontSize: 14,
                    color: "#5c4a3a",
                    lineHeight: 1.6,
                    margin: "0 0 16px",
                  }}
                >
                  {truncate(i.message)}
                </p>

                {/* Actions */}
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <a
                    href={`mailto:${i.email}?subject=Re: Your Jazy's House Catering Inquiry`}
                    style={{
                      background: "#c0563d",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "9px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      textDecoration: "none",
                    }}
                  >
                    Reply
                  </a>
                  <div>
                    <CateringStatusSelect id={i.id} status={i.status} />
                  </div>
                  <span
                    style={{ fontSize: 11.5, color: "#a39685", marginLeft: "auto" }}
                  >
                    {i.createdAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
