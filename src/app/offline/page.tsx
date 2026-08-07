import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline — Jazy's House",
  robots: { index: false },
};

/** Static fallback served by the service worker when a navigation fails offline. */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold">
        You&apos;re offline
      </h1>
      <p className="max-w-sm text-muted-foreground">
        We couldn&apos;t reach Jazy&apos;s House. Check your connection and try
        again — recently viewed pages may still be available.
      </p>
      <Link
        href="/"
        className="rounded-md bg-[var(--tenant-primary,#c0563d)] px-5 py-2.5 text-sm font-medium text-white"
      >
        Retry
      </Link>
    </main>
  );
}
