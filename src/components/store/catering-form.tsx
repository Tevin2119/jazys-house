"use client";

import { useActionState } from "react";
import {
  submitCateringInquiry,
  type InquiryState,
} from "@/app/(store)/catering/actions";
import { CATERING_PACKAGES } from "@/lib/catering-packages";

const INITIAL: InquiryState = { ok: false };

const fieldClass =
  "w-full rounded-md border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

/** Catering inquiry form. Creates a tenant-scoped CateringInquiry on submit. */
export function CateringForm() {
  const [state, action, pending] = useActionState(
    submitCateringInquiry,
    INITIAL,
  );

  if (state.ok) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mb-3 text-4xl">🧡</div>
        <h3 className="font-heading text-2xl font-bold italic">
          Inquiry sent!
        </h3>
        <p className="mt-2 text-muted-foreground">
          Thank you — we&apos;ll get back to you within 24 hours to craft your
          African feast.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="mx-auto grid max-w-2xl gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" required placeholder="Your Name" className={fieldClass} />
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className={fieldClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="date" type="date" required className={fieldClass} aria-label="Event date" />
        <input
          name="guests"
          type="number"
          min={1}
          required
          placeholder="Number of Guests"
          className={fieldClass}
        />
      </div>
      <select name="package" className={fieldClass} defaultValue="" aria-label="Package">
        <option value="">Select a Package (Optional)</option>
        {CATERING_PACKAGES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.name}
          </option>
        ))}
      </select>
      <textarea
        name="message"
        required
        rows={5}
        placeholder="Tell us about your event — venue, theme, dietary needs, anything else…"
        className={fieldClass}
      />
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-70"
      >
        {pending ? "Sending…" : "Send Inquiry"}
      </button>
    </form>
  );
}
