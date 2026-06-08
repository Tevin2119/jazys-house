"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

/**
 * Credentials sign-in server action. On success `signIn` throws a redirect to
 * `/admin` (which we re-throw); on failure we surface a generic message — never
 * leak whether the email or the password was the wrong part.
 */
export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
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
