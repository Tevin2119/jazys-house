"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * Credentials sign-in server action. Checks the user's role before calling
 * signIn so admins land on /admin and customers land on /account. On failure
 * surfaces a generic message — never leaks which field was wrong.
 */
export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const email =
    typeof formData.get("email") === "string"
      ? (formData.get("email") as string).trim().toLowerCase()
      : "";

  // Pre-check role to pick the landing page — not a security shortcut;
  // the actual credential check still runs inside signIn().
  let redirectTo = "/account";
  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });
    if (user?.role === "SUPER_ADMIN" || user?.role === "TENANT_ADMIN") {
      redirectTo = "/admin";
    }
  }

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.type === "CredentialsSignin"
        ? "Invalid email or password."
        : "Could not sign in. Please try again.";
    }
    // Re-throw redirects and anything we don't explicitly handle.
    throw error;
  }
  return undefined;
}
