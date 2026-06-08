"use server";

import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";
import { CATERING_PACKAGE_VALUES } from "@/lib/catering-packages";

export interface InquiryState {
  ok: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Create a tenant-scoped catering inquiry from the storefront form.
 *
 * Tenant is resolved server-side from the request host — never trusted from the
 * client. Designed for React `useActionState`: returns a result object instead
 * of throwing so the form can show inline success/error states.
 */
export async function submitCateringInquiry(
  _prev: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { ok: false, error: "Store not found for this address." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const guestsRaw = String(formData.get("guests") ?? "").trim();
  const pkg = String(formData.get("package") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const guests = Number.parseInt(guestsRaw, 10);

  if (!name || !email || !date || !message) {
    return { ok: false, error: "Please fill in all required fields." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!Number.isInteger(guests) || guests < 1) {
    return { ok: false, error: "Please enter a valid number of guests." };
  }
  if (pkg && !CATERING_PACKAGE_VALUES.includes(pkg)) {
    return { ok: false, error: "Unknown catering package." };
  }

  await prisma.cateringInquiry.create({
    data: {
      tenantId: tenant.id,
      name,
      email,
      date,
      guests,
      package: pkg || null,
      message,
    },
  });

  return { ok: true };
}
