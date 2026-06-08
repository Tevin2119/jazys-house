# Supabase Setup Guide

Step-by-step instructions for provisioning the PostgreSQL database that backs
**Jazy's House** (Next.js 15 + Prisma 6, deployed on Vercel). Follow these in
order; by the end you'll have a seeded, multi-tenant database you can log into.

---

## 1. Create a Supabase project (free tier)

1. Sign in at [supabase.com](https://supabase.com) and click **New project**.
2. Pick (or create) an organization, then set:
   - **Name** — e.g. `jazyshouse` (use a separate project for dev vs. prod).
   - **Database Password** — generate a strong one and **save it**; it appears
     in both connection strings below and is hard to recover later.
   - **Region** — choose the region closest to your Vercel deployment. This app
     deploys to Vercel `iad1` (US East), so a US East Supabase region keeps
     latency low.
3. Click **Create new project** and wait for provisioning to finish (~2 min).

> The free tier is enough for development and a small production launch. Note
> that free-tier projects are **paused after ~1 week of inactivity** — just
> resume from the dashboard if that happens.

---

## 2. Connection strings — pooled vs. direct (and why both)

This project needs **two** database URLs. Open
**Project Settings → Database → Connection string** in the Supabase dashboard
to find them.

### `DATABASE_URL` — pooled (port 6543)

Used by the running app at runtime. Pick the **Transaction** pooler tab. It
routes through PgBouncer and looks like:

```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

- Port **6543** = PgBouncer transaction pooler.
- The `?pgbouncer=true&connection_limit=1` suffix is **required**. Serverless
  functions (Vercel) spin up many short-lived instances; the transaction pooler
  multiplexes them onto a small set of real Postgres connections so you don't
  exhaust the database's connection limit. `pgbouncer=true` tells Prisma to
  disable prepared statements (the transaction pooler can't keep them across
  pooled connections), and `connection_limit=1` keeps each serverless instance
  to a single connection.

### `DIRECT_URL` — direct/session (port 5432)

Used **only** for schema migrations. Pick the **Session** pooler (or direct
connection) tab:

```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

- Port **5432** = a direct, session-based connection (no transaction pooling).
- **No** `pgbouncer=true` suffix.

### Why two URLs?

Prisma's `datasource` is wired up in
[`prisma/schema.prisma`](../prisma/schema.prisma) like this:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")  // pooled — runtime queries
  directUrl = env("DIRECT_URL")    // direct — migrations / introspection
}
```

Migrations and Prisma's introspection rely on **prepared statements** and a
stable session, which the PgBouncer **transaction** pooler (port 6543) does not
support. Running `prisma migrate` through the pooled URL produces errors like
`prepared statement "s0" already exists`. So migrations go through `DIRECT_URL`
(port 5432) while normal serverless queries use the pooled `DATABASE_URL`.

---

## 3. Put them in `.env`

Copy the template and fill in your real values. See
[`.env.example`](../.env.example) for the full, annotated list of variables.

```bash
cp .env.example .env
```

At minimum, set the two database URLs:

```dotenv
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

While you're here, also set the other required variables documented in
`.env.example`:

- `AUTH_SECRET` — generate with `openssl rand -base64 32`
- `SEED_ADMIN_PASSWORD` — password for the seeded admin accounts (default
  `admin1234`, dev-only)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ROOT_DOMAIN`, `DEFAULT_TENANT_SLUG`

> **Never commit `.env`.** On Vercel, set these under
> **Project Settings → Environment Variables** instead.

---

## 4. Run migrations

Make sure dependencies are installed first (`npm install` also runs
`prisma generate` via `postinstall`).

### Production — apply existing migrations

```bash
npx prisma migrate deploy
```

This applies the committed migration history without generating new migrations.
It connects through `DIRECT_URL` (port 5432) — that's exactly why the direct URL
exists.

### Development alternatives

- **Quick schema sync (no migration files)** — fastest for iterating locally:

  ```bash
  npm run db:push        # prisma db push
  ```

- **Create + apply a migration (keeps history)** — use when you've changed
  `schema.prisma` and want a versioned migration:

  ```bash
  npm run db:migrate     # prisma migrate dev
  ```

Both dev commands also route schema changes through `DIRECT_URL`.

---

## 5. Seed demo data

```bash
npm run db:seed          # tsx prisma/seed.ts
```

This populates the database with **three demo tenants**, each with its own
theme, catalog subset, and owner:

| Slug         | Notes                            |
| ------------ | -------------------------------- |
| `jazyshouse` | default tenant (root domain)     |
| `afrochic`   | distinct theme + catalog         |
| `baobab`     | distinct theme + catalog         |

It also creates **admin logins** (password = `SEED_ADMIN_PASSWORD`, default
`admin1234`):

| Email                   | Role          |
| ----------------------- | ------------- |
| `admin@jazyshouse.com`  | `SUPER_ADMIN` |
| `owner@jazyshouse.com`  | `TENANT_ADMIN`|

> All IDs are CUIDs. Tenant-scoped tables (`Product`, `Order`, `Category`,
> `Theme`, `Page`) are seeded per tenant; shared tables (`Tenant`, `User`,
> `AdminSession`) hold the cross-tenant records.

---

## 6. Verify

Open Prisma Studio to browse the data in a local web UI:

```bash
npm run db:studio        # prisma studio
```

You should see the three tenants, their products/categories, and the seeded
users. You can also confirm in the Supabase dashboard under
**Table Editor**. After that, run the app with `npm run dev` and log in at
`/login` with one of the seeded admin accounts.

---

## 7. Troubleshooting

- **`prepared statement "s0" already exists` (or similar) during migrate** —
  you're running migrations through the **pooled** URL (port 6543 /
  `pgbouncer=true`). Migrations must use `DIRECT_URL` (port 5432). Confirm
  `DIRECT_URL` is set and that `schema.prisma` has
  `directUrl = env("DIRECT_URL")`.

- **Too many connections / connection timeouts at runtime** — make sure
  `DATABASE_URL` keeps the `?pgbouncer=true&connection_limit=1` suffix.
  Dropping it lets each serverless instance open multiple connections and you'll
  exhaust the free-tier connection limit.

- **`Can't reach database server` from Vercel / certain networks** — Supabase's
  direct connection (5432) is IPv6 by default. If your environment is IPv4-only,
  either use the **Session pooler** host (which is IPv4-reachable) for
  `DIRECT_URL`, or enable the Supabase **IPv4 add-on**. Also double-check the
  region segment (`aws-0-<region>`) in the host matches your project's region.

- **Auth callback / host mismatch on custom domains** — if you serve tenants on
  custom domains behind a proxy, set `AUTH_TRUST_HOST="true"` (see
  `.env.example`).
