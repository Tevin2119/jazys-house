export const dynamic = "force-dynamic";

import type { Prisma } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { SelectFilter } from "@/components/admin/filters";
import { CateringStatusSelect } from "@/components/admin/catering-status-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function truncate(text: string, max = 60): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

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
      <PageHeader
        title="Catering inquiries"
        action={
          <SelectFilter
            paramKey="status"
            placeholder="All statuses"
            options={[
              { value: "new", label: "New" },
              { value: "contacted", label: "Contacted" },
              { value: "booked", label: "Booked" },
              { value: "declined", label: "Declined" },
            ]}
          />
        }
      />

      {inquiries.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No catering inquiries match this view.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.name}</TableCell>
                <TableCell>{i.email}</TableCell>
                <TableCell>{i.date}</TableCell>
                <TableCell>{i.guests}</TableCell>
                <TableCell>{i.package ?? "—"}</TableCell>
                <TableCell title={i.message}>{truncate(i.message)}</TableCell>
                <TableCell>
                  <CateringStatusSelect id={i.id} status={i.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {i.createdAt.toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
