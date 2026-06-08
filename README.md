# Jazy's House Platform

**Jazy's House** is a multi-tenant African handmade e-commerce platform. A single
deployment serves many independent storefronts, each resolved per-request from its
host. Every store gets its own catalog, categories, and per-tenant theming (colors,
font, logo), a customer-facing storefront with Stripe checkout, and an admin
dashboard for owners and platform super-admins. The app is an installable PWA with
an offline fallback. Built with Next.js 15 (App Router, React 19), Prisma +
PostgreSQL (Supabase), Auth.js v5, and Tailwind v4.

## Tech stack

- **Next.js 15** — App Router, React Server Components by default, route groups for
  storefront vs. admin separation.
- **React 19** — UI runtime.
- **TypeScript 5.7** — strict typing across the codebase.
- **Prisma 6** + **PostgreSQL (Supabase)** — type-safe data access; pooled
  connection at runtime, direct connection for migrations.
- **Auth.js v5 (NextAuth, beta)** — admin/owner authentication; host auto-detected
  on Vercel.
- **Stripe 17** — checkout sessions created server-side; the secret key never
  reaches the client.
- **Tailwind v4** + **shadcn/ui** (Radix primitives) — styling and component
  library; tenant theming via CSS variables.
- **PWA** — `manifest` + service worker for installability and an offline fallback.
- **Vercel** — hosting (region `iad1`, configured in `vercel.json`).

## Quick start

```bash
git clone <repo-url> jazyshouse-platform
cd jazyshouse-platform
npm install
cp .env.example .env
```

Fill in `.env`:

- `DATABASE_URL` — Supabase **pooled** connection (port `6543`, with
  `?pgbouncer=true&connection_limit=1`).
- `DIRECT_URL` — Supabase **direct** connection (port `5432`, used for migrations).
- `AUTH_SECRET` — generate one:
  ```bash
  openssl rand -base64 32
  ```
- `STRIPE_SECRET_KEY` (`sk_...`), `STRIPE_WEBHOOK_SECRET` (`whsec_...`),
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_...`).
- `SEED_ADMIN_PASSWORD` — password for the seeded admin accounts
  (default `admin1234`, dev-only).

Then apply the schema, seed demo data, and start the dev server:

```bash
npm run db:push    # sync the Prisma schema to the database
npm run db:seed    # seed three demo tenants + admin users
npm run dev        # http://localhost:3000
```

Visit **http://localhost:3000**.

## Admin access

After seeding, log in at **`/login`** with one of the seeded accounts:

| Email                    | Role           | Scope                                  |
| ------------------------ | -------------- | -------------------------------------- |
| `admin@jazyshouse.com`   | `SUPER_ADMIN`  | Platform-wide; creates/manages stores  |
| `owner@jazyshouse.com`   | `TENANT_ADMIN` | A single store's catalog and settings  |

The password for both is the value of `SEED_ADMIN_PASSWORD` (default `admin1234`).
Super admins create and manage stores under **Admin → Stores**; per-store branding
lives under **Admin → Settings**.

## Architecture overview

### Route groups

- **`(store)`** — the customer-facing storefront.
- **`(admin)`** — the `/admin` dashboard for owners and super admins.
- **`/login`** — authentication.
- **`/api`** — route handlers and webhooks.

### Multi-tenant setup

Each storefront is a `Tenant` resolved per-request from the host (see
`src/lib/tenant.ts`). A tenant resolves four ways, in order: an explicit slug
via a `/store/<slug>` path (dev/testing), a custom domain (`tenant.domain`), a
subdomain of the root domain (`jazyshouse.localhost:3000`), and finally the bare
root domain (`localhost:3000`), which falls back to `DEFAULT_TENANT_SLUG` (or the
oldest tenant). Slugs match case-insensitively and `www.`/ports are ignored.
The seed provisions three themed demo stores — **jazyshouse**, **afrochic**, and
**baobab** — each with its own categories, catalog subset, theme, and owner;
super admins create and manage stores under **Admin → Stores**, and per-store
branding (colors, font, logo) lives under **Admin → Settings**. To preview a
specific store on the root domain, run `npm run dev:jazyshouse`.

### How resolution is wired

The Edge runtime can't run Prisma, so tenant resolution is **not** done at the
edge. `src/middleware.ts` is intentionally thin: it forwards the incoming hostname
to Server Components via the `x-tenant-host` header (and, for the `/store/<slug>`
path affordance, an `x-tenant-slug` header) without ever touching the database.
The actual Prisma lookup happens in the Node runtime inside `src/lib/tenant.ts`.

### Other conventions

- **Server Components by default** — data fetching happens in `async` Server
  Components; `"use client"` is only added where interactivity is needed.
- **Stripe is server-side only** — checkout sessions are created in
  `src/app/(store)/checkout/actions.ts`; the webhook handler lives at
  `src/app/api/webhooks/stripe/route.ts` (public path `/api/webhooks/stripe`).
  The secret key never reaches the client.
- **Money is stored as integer minor units (pence)** — `Int` columns, never floats.
- **Database** — IDs are CUIDs. Tenant-scoped tables: `Product`, `Order`,
  `Category`, `Theme`, `Page`. Shared tables: `Tenant`, `User`, `AdminSession`.
  Schema: `prisma/schema.prisma`.
- **PWA** — web app manifest (`src/app/manifest.ts`) plus a service worker
  (`public/sw.js`) registered client-side by `src/components/pwa-register.tsx`.

## Scripts

| Script                   | Command                                    | Description                                                   |
| ------------------------ | ------------------------------------------ | ------------------------------------------------------------- |
| `npm run dev`            | `next dev`                                 | Start the dev server at http://localhost:3000.               |
| `npm run dev:jazyshouse` | `node scripts/dev-tenant.mjs jazyshouse`   | Dev server previewing the `jazyshouse` store on the root domain. |
| `npm run build`          | `prisma generate && next build`            | Generate the Prisma client and build for production.         |
| `npm run start`          | `next start`                               | Serve the production build.                                  |
| `npm run lint`           | `next lint`                                | Run ESLint.                                                  |
| `npm run typecheck`      | `tsc --noEmit`                             | Type-check without emitting.                                 |
| `npm run db:migrate`     | `prisma migrate dev`                       | Create/apply a dev migration (keeps migration history).     |
| `npm run db:push`        | `prisma db push`                           | Sync the schema to the DB without a migration (quick dev sync). |
| `npm run db:seed`        | `tsx prisma/seed.ts`                       | Seed demo tenants + admin users (also wired as `prisma.seed`). |
| `npm run db:studio`      | `prisma studio`                            | Open Prisma Studio.                                         |

`postinstall` runs `prisma generate` automatically after `npm install`.

## Deployment

The app deploys to **Vercel** (region `iad1`). `vercel.json` sets the build command
to `prisma generate && next build`.

1. **Set production environment variables** in the Vercel project
   (Settings → Environment Variables) — the same vars as `.env`, with:
   - `NEXT_PUBLIC_APP_URL` → your canonical `https` URL.
   - `NEXT_PUBLIC_ROOT_DOMAIN` → bare root domain for subdomain routing.
   - `DATABASE_URL` → pooled (6543); `DIRECT_URL` → direct (5432) for migrations.
   - `STRIPE_*` → swap test keys for live keys; point the webhook at
     `/api/webhooks/stripe`.
   - Optional: `AUTH_TRUST_HOST=true` if you serve tenants on custom domains
     behind a proxy and hit host/callback mismatches.
2. **Apply migrations** against the production database (uses `DIRECT_URL`):
   ```bash
   npx prisma migrate deploy
   ```

See [`docs/supabase-setup.md`](docs/supabase-setup.md) for database provisioning
and [`docs/stripe-setup.md`](docs/stripe-setup.md) for Stripe configuration.

## PWA

The storefront is an **installable Progressive Web App** with an **offline
fallback**. The service worker is registered **in production only**, so local
development is not affected by SW caching.

## Development workflow — "Council of Kangs"

This project is built using an agent-orchestrated process called the **Council of
Kangs**, recorded under `.doa/`:

- `.doa/plans/` — planning documents.
- `.doa/council/` — council deliberation.
- `.doa/reviews/` — review records.
- `.doa/implementations/` — per-phase implementation logs
  (`JH-001 phase1` … `phase6`; this phase is deploy / PWA polish).
- `.doa/prompts/` and `.doa/state.json` — prompt library and workflow state.

Specialist subagents live in `.claude/agents/`:

- **orchestrator** — drives the overall workflow.
- **db-investigator** — database and Prisma schema work.
- **payments-guardian** — Stripe and checkout integrity.
- **storefront-reviewer** — customer-facing storefront review.
- **tenancy-guardian** — multi-tenant isolation and resolution.
