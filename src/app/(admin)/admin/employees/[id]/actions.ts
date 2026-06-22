"use server";

import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";
import { getAdminContext } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ASSIGNABLE_ROLES: UserRole[] = ["OWNER", "ADMIN", "EMPLOYEE"];

export async function updateMembershipRole(membershipId: string, role: UserRole): Promise<void> {
  const { tenantId } = await getAdminContext();
  if (!ASSIGNABLE_ROLES.includes(role)) throw new Error("Invalid role.");

  await prisma.tenantMembership.updateMany({
    where: { id: membershipId, tenantId },
    data: { role },
  });

  revalidatePath(`/admin/employees/${membershipId}`);
  revalidatePath("/admin/employees");
}

export async function updateMembershipPermissions(
  membershipId: string,
  permissions: Record<string, Record<string, boolean>>,
): Promise<void> {
  const { tenantId } = await getAdminContext();

  await prisma.tenantMembership.updateMany({
    where: { id: membershipId, tenantId },
    data: { permissions: permissions as object },
  });

  revalidatePath(`/admin/employees/${membershipId}`);
}
