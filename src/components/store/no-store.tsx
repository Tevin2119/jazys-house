/** Shown when the request host doesn't resolve to a seeded tenant. */
export function NoStore() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="font-heading text-3xl font-bold italic">
        No store here yet
      </h1>
      <p className="mt-3 text-muted-foreground">
        No tenant is configured for this address. Seed a tenant or visit the
        store via its subdomain or slug (e.g. <code>jazyshouse.localhost:3000</code>).
      </p>
    </div>
  );
}
