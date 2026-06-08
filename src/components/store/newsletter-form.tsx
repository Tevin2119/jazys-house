"use client";

import { useActionState } from "react";
import {
  subscribeNewsletter,
  type NewsletterState,
} from "@/app/(store)/actions";

const INITIAL: NewsletterState = { ok: false };

/** Footer newsletter signup. Posts to the tenant-scoped server action. */
export function NewsletterForm({ cta = "Sign Me Up" }: { cta?: string }) {
  const [state, action, pending] = useActionState(
    subscribeNewsletter,
    INITIAL,
  );

  if (state.ok) {
    return (
      <p className="text-sm font-medium text-primary">
        Welcome to the family 🧡 — 10% off your first order is on its way.
      </p>
    );
  }

  return (
    <form action={action} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
      <input
        type="email"
        name="email"
        required
        placeholder="your@email.com"
        className="flex-1 rounded-md border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-70"
      >
        {pending ? "…" : cta}
      </button>
      {state.error ? (
        <p className="w-full text-sm text-destructive sm:mt-1">{state.error}</p>
      ) : null}
    </form>
  );
}
