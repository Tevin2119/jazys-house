"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentTenant } from "@/lib/tenant";
import { assertRateLimit } from "@/lib/rate-limit";

export interface NewsletterState {
  ok: boolean;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter signup — tenant-scoped, idempotent on (tenantId, email). A repeat
 * subscribe is a no-op success rather than an error. Designed for React
 * `useActionState`.
 */
export async function subscribeNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { ok: false, error: "Store not found for this address." };

  await assertRateLimit("newsletter", 5, 60_000);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  try {
    await prisma.newsletterSignup.create({
      data: { tenantId: tenant.id, email },
    });
  } catch (err) {
    // Unique violation = already subscribed → treat as success.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { ok: true };
    }
    throw err;
  }

  return { ok: true };
}
