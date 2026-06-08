import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

// Auth state is per-request — never statically prerendered.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="font-[var(--font-heading)] text-2xl font-bold">
            Jazy&apos;s House
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to the admin dashboard
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
