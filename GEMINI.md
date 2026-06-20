# Jazy's House Platform — Adversary / Archivist Context (agy + Pi)

> **Seats:** 5 (Adversary / Lex — agy CLI) + 6 (Archivist / Doom — Pi CLI, independent)
> **Stack:** Next.js 15.5 (App Router), Prisma ORM, PostgreSQL (Supabase), Stripe, Tailwind, shadcn/ui
> **Tenancy:** Multi-tenant via x-tenant-host header + path-based routing
> **Auth:** NextAuth v5 (JWT, bcryptjs, SUPER_ADMIN/TENANT_ADMIN/CUSTOMER roles)

---

## CLIs

| Seat | Agent | CLI | Model | Invocation |
|------|-------|-----|-------|------------|
| 5 — Adversary | Lex Luthor | agy 1.0.10 | gemini-2.5-pro | `agy --print --print-timeout 300s --dangerously-skip-permissions -p "adversarial audit: [problem]"` |
| 6 — Archivist | Doom 2099 | pi 0.79.6 | gpt-5.4-mini | `pi -p "pattern check: [problem]"` (loads archivist extension) |

---

## Architecture Overview

This is a multi-tenant e-commerce platform for African food/catering products. One admin dashboard serves multiple customer-facing storefronts. Each tenant has isolated products, orders, categories, and users.

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | Next.js 15.5 App Router | Route groups: (store)/(admin) |
| Database | Prisma + PostgreSQL (Supabase) | Pooled connection (port 6543) for runtime, direct (5432) for migrations |
| Auth | NextAuth v5 | Credentials provider, JWT sessions, 3-level role system |
| Payments | Stripe | Server-side Checkout sessions, webhooks, pence-based pricing |
| Styling | Tailwind CSS + shadcn/ui | Mobile-first, PWA-capable |
| Deploy | Vercel | Free tier, custom domain support |

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | 7 models: Tenant, Category, Product, Order, OrderItem, User, CateringInquiry |
| `src/middleware.ts` | Tenant resolution (x-tenant-host header, path-based routing) |
| `src/lib/db.ts` | Prisma client singleton |
| `src/lib/tenant.ts` | Tenant context helpers |
| `src/lib/auth.ts` | NextAuth configuration |
| `src/lib/stripe.ts` | Stripe server-side helpers |
| `src/app/(store)/` | Customer-facing storefront routes |
| `src/app/(admin)/` | Admin dashboard routes |
| `.env` | DATABASE_URL, Stripe keys, AUTH_SECRET |

## Council Protocol (7 Seats)

```
 0. PREFLIGHT       → Hermes checks all CLI seats + repo health
 1. INVESTIGATION   → Claude (1), Codex (3), OpenCode (2), Adversary (5 — agy), Maker (4 — Pi)
 2. PLAN            → Claude plan + OpenCode validate
 3. IMPLEMENT       → Claude build + Codex backvalidate
 4. VERDICT         → Archivist (6 — Pi) accountability report
```

## Persona Jurors (Jazy's House)

| Persona | Role | Key Concern |
|---------|------|-------------|
| Dienaba | Store Owner | Fast product upload, clear orders, payment confidence |
| Aminata | Customer | Beautiful mobile store, fast checkout, trust |
| Tevin | Admin/Dev | Multi-tenant isolation, easy deploys, clean code |
| Visitor | Anonymous | Clear navigation, compelling store, social proof |

## Attack Vectors (Adversary Focus)

| Vector | Next.js Pattern | Check |
|--------|----------------|-------|
| XSS | dangerouslySetInnerHTML, unescaped user input in JSX | Every render path |
| IDOR | Missing tenantId filter on Prisma queries | lib/db.ts, all server actions |
| CSRF | Missing CSRF on Server Actions / API routes | All POST/PUT/DELETE routes |
| Auth Bypass | Client-side-only role checks | All admin routes, middleware |
| SSRF | User-supplied URLs (image upload, webhook targets) | fetch() calls with user input |
| Stripe Exposure | Secret key in client bundle | grep STRIPE_SECRET_KEY in all .tsx files |
| SQL Injection | Raw Prisma queries ($queryRaw, $executeRaw) | Search for raw SQL usage |
| Race Condition | Read-then-write order/stock operations | Order status transitions, stock decrement |

## Build & Test Commands

```bash
# Build check
npx next build

# Type check
npx tsc --noEmit

# Lint
npx next lint

# Prisma migration check
npx prisma migrate status

# Run dev server
npx next dev
```

## Pitfalls

- **Edge runtime** — Prisma doesn't run in Edge. Middleware must be lightweight (no DB calls).
- **Stripe keys** — Stripe secret key must NEVER appear in client bundles. Use NEXT_PUBLIC_ prefix only for publishable key.
- **Tenant isolation** — Every Prisma query must filter by tenantId. Missing filter = cross-tenant data leak.
- **NextAuth v5** — Uses JWT strategy. No database sessions. Role stored in JWT claims.
- **Vercel** — Cold starts on free tier. Builds use pooled DB connection (pgbouncer).
- **agy --print** — Can return empty on large context. Use `--print-timeout 300s` minimum. agy respects .gitignore — can't read .doa/ directly.
- **Pi Archivist** — Loads `archivist` extension with `archivist-commands.ts`, `archivist-mcp.ts`, `archivist-tools.ts`. Runs independently, NOT as a subagent.
- **DC Framework** — New UI framework at `C:\Users\Tevin\Downloads\Jazys House App (1).html` supersedes the original static site demo. Design tokens extracted to `STYLE-GUIDE.md`.
