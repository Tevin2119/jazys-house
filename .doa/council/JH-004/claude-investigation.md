Investigation written. Here's what I found across the 6 areas:

**Image Storage:** Cloudflare R2 wins — it's the only option with zero egress fees, which matters because product images are fetched on every storefront page load. 10GB free covers 63 images hundreds of times over. Vercel Blob hits a cost cliff at 10GB; Supabase Storage's egress pricing ($0.09/GB) would be punishing at real traffic.

**Database:** Supabase 500MB is fine — 500K product rows fit in that budget. The real risk isn't size, it's no automated backups. Fix: GitHub Actions cron running `pg_dump` → R2. Cost: £0. The `lib/db.ts` singleton and `DATABASE_URL`/`DIRECT_URL` split are already correct; just need `?pgbouncer=true&connection_limit=1` added to the pooled URL.

**Hosting:** Stay on Vercel — the 100GB bandwidth limit is manageable because images will be on R2, not Vercel. The hidden danger is the **12 serverless function route limit** on the Hobby tier; the codebase may hit this by end of Phase 3. Mitigate by consolidating admin API handlers. Cloudflare Pages is a dead end — NextAuth + Prisma on Workers runtime is not production-ready.

**Multi-tenant:** The architecture is solid. Edge middleware only injects headers (no DB hit), `React.cache()` deduplicates tenant lookups per render — both correct. The one gap: no enforcement that every Prisma query includes `tenantId`. A `tenantPrisma(tenantId)` Prisma Client Extension would make isolation a guardrail, not just a convention.

**Frontend:** `sc-if` → JSX conditional, `sc-for` → `.map()`, hardcoded products → `prisma.product.findMany()` in Server Components. Cart stays client-side (Zustand). ISR on product pages eliminates cold-start penalty for storefront visitors.

**Email:** Resend — 3,000/mo free, React Email native support, clean one-liner API. At launch volume (~1,250 emails/mo) stays well within the free tier.

**Total infrastructure cost at launch: £0/mo.** Setup effort: ~11 hours.
 'https://res.cloudinary.com/<cloud_name>/image/upload/'
}
```
Upload flow: Cloudinary Upload Widget in admin form → signed upload preset → URL returned directly

**Vercel Blob (DX winner, cost loser):**
```ts
import { put } from '@vercel/blob';
const blob = await put(filename, file, { access: 'public' });
// blob.url stored in Product.images[]
```
Zero config, but 10GB free tier is hit fast with image-heavy catalog.

### Recommendation

**WINNER: Cloudflare R2**
- Only option with zero egress fees — critical for a storefront where every page load fetches images
- 10GB free covers 63 existing images many times over (63 images at ~200KB avg = ~12MB)
- S3-compatible API means standard tooling, no proprietary lock-in
- Setup effort: ~4 hours (account, bucket, R2 public access, CORS config, env vars, presigned upload)
- Cost at 10× scale (1000 images, high traffic): ~$2-5/mo storage — still essentially free

**FALLBACK: Cloudinary** if R2 setup is blocked  
- 25GB free tier is generous and image transforms (WebP auto-conversion) are a genuine bonus
- BUT: pay-per-view pricing model at scale is a cost trap. Avoid if expecting high traffic.

**AVOID: Vercel Blob** — hits cost cliff at 10GB, then $0.15/GB with no egress discount  
**AVOID: Supabase Storage** — 1GB free is too small, egress pricing is hostile to image-heavy workloads

---

## 2. DATABASE — SUPABASE FREE TIER

### Row Count vs 500MB

Based on the schema (7 models, all tenant-scoped):

| Model | Estimated Row Size | 500MB Row Capacity |
|-------|-------------------|-------------------|
| Product | ~1KB (id + name + description + images JSON + indexes) | ~500,000 rows |
| Order | ~800 bytes | ~625,000 rows |
| OrderItem | ~400 bytes | ~1,250,000 rows |
| User | ~350 bytes | ~1,400,000 rows |
| CateringInquiry | ~500 bytes | ~1,000,000 rows |
| NewsletterSignup | ~200 bytes | ~2,500,000 rows |
| Category | ~250 bytes | ~2,000,000 rows |

**Conclusion: 500MB is more than sufficient for years of growth.**

Real-world growth projection:
- Launch (1 tenant, 63 products): ~2MB used
- 1 year (1 tenant, 500 products, 5K orders): ~10MB
- 5 tenants, 1000 products each, 50K orders: ~100MB
- 500MB only becomes tight at ~50 tenants × 1000 products each — far beyond Phase 3 scope

**What actually consumes Supabase's 500MB:**
- PostgreSQL system overhead: ~50MB baseline
- WAL (write-ahead log) during heavy writes
- Index storage: roughly 20-30% on top of data
- TOAST storage for long text/JSON fields (descriptions, themes)
- Factor: real usable data = ~350MB of the 500MB limit

### Connection Pooling Analysis

The codebase already implements the correct pattern:
- `DATABASE_URL` = PgBouncer pooled URL (Supabase provides this)
- `DIRECT_URL` = direct Postgres connection (Prisma migrations require this)
- `lib/db.ts` implements the singleton pattern correctly

**Vercel serverless + Prisma risk assessment:**
- Each cold-start serverless function invocation creates a new Prisma connection attempt
- PgBouncer (Supabase) handles this by pooling — the pool absorbs the spike
- Supabase free: PgBouncer allows up to ~200 concurrent connections from outside
- At launch traffic: far below this limit
- Risk materialises at: sustained >50 concurrent users all hitting API routes simultaneously

**Mitigation already in place:** `lib/db.ts` singleton prevents multiple clients per process. The `DATABASE_URL` should include `?pgbouncer=true&connection_limit=1` parameters to cap per-serverless-worker connections (Prisma docs recommend `connection_limit=1` for serverless).

**At 10 tenants:** No change in connection behaviour — tenantId is just a filter. All tenants share the same pool.  
**At 100 tenants:** Same pool, more data — queries remain fast because `tenantId` indexes are on every table.

### Alternative Free Databases

| Option | Free Tier | Notes |
|--------|-----------|-------|
| Neon | 0.5GB free | Branching for dev, auto-suspend (cold starts) |
| PlanetScale | 5GB free | MySQL — requires full schema rewrite, not viable |
| Railway | $5 credit/mo | Runs out, not truly free |
| Fly.io Postgres | 3GB storage | Complex setup, good for later |

**Stay on Supabase.** The stack is already working and 500MB is adequate. Neon's branching is nice but doesn't justify migration complexity.

### Backup Strategy (CRITICAL)

**Supabase free tier has NO automated backups.** A corrupted or accidentally dropped table is unrecoverable.

**Cheapest solution: GitHub Actions cron + pg_dump → Cloudflare R2**

```yaml
# .github/workflows/db-backup.yml
on:
  schedule:
    - cron: '0 2 * * *'  # 2am daily
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - run: pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz
      - run: # upload to R2 via awscli with R2 endpoint
```

Cost: **£0/mo** — GitHub Actions free tier (2,000 min/mo) + R2 storage (~$0.015/GB/mo for backup files)  
Retention: keep 30 daily backups, ~30MB/backup = ~1GB R2 storage = $0.015/mo

---

## 3. HOSTING — VERCEL FREE TIER

### Limit Analysis

| Limit | Free Tier | Risk Level |
|-------|-----------|-----------|
| Bandwidth | 100GB/mo | LOW — images on R2, not Vercel |
| Build minutes | 6,000/mo | LOW — ~3-4 min/build = 1,500 builds |
| Serverless function routes | 12 | **MEDIUM — needs monitoring** |
| Function execution timeout | 10s | MEDIUM — Stripe webhooks |
| Deployments/day | 100 | LOW |
| Custom domains | Unlimited | N/A — fine |

### Route Count Risk

The 12 serverless function route limit is the most dangerous constraint. Routes include:
- Each `app/api/*/route.ts` file
- Each page with a Server Action (NOT counted separately in App Router)
- NextAuth route: `/api/auth/[...nextauth]/route.ts` = 1 route

Current routes (estimate from Phase 2):
- `/api/auth/[...nextauth]` = 1
- `/api/checkout` = 1  
- `/api/webhooks/stripe` = 1
- Admin API routes (products, orders, catering) = ~6-8

**Risk: approaching or at the 12-route limit by end of Phase 3.**

Mitigation: consolidate admin CRUD under fewer paths (e.g., `/api/admin/[resource]/route.ts` handles multiple methods via `switch(request.method)`). Server Actions (Phase 3 forms) do NOT count against this limit.

### Cold Starts

- Edge middleware (tenant resolution): <5ms — already at edge, correct
- Server Components: rendered in Node runtime — first request after inactivity has ~100-300ms cold start
- Impact on storefront UX: visible on first browse after period of inactivity
- Mitigation: ISR (`revalidate`) on product/category pages so HTML is pre-generated

### Cloudflare Pages vs Vercel

**Cloudflare Pages advantages:**
- Unlimited bandwidth (vs 100GB on Vercel)
- Global edge rendering

**Cloudflare Pages blockers for this stack:**
- NextAuth v5 is not well-supported on Cloudflare Workers runtime
- Prisma requires Node.js runtime — Cloudflare Workers use V8 isolates (incompatible without a separate adapter)
- Would require switching to Cloudflare D1 (SQLite) or keeping Supabase via HTTP (no direct connections)
- Build system differences add friction

**Verdict: Stay on Vercel.** The compatibility story for Next.js + Prisma + NextAuth on Cloudflare is not production-ready without significant rework. The 100GB bandwidth limit is manageable because product images are served from R2, not Vercel.

---

## 4. MULTI-TENANT ARCHITECTURE

### Current Design Assessment

The current architecture is solid and correct for this scale:

```
Request → Edge Middleware (host → x-tenant-host header)
       → Server Component Layout (getCurrentTenant() — cached per request)
       → Prisma queries (all filtered by tenantId)
```

Key strengths observed in the code:
1. **Middleware does NOT hit the database** — correctly deferred to Node runtime via `lib/tenant.ts`
2. **`React.cache()` wraps all tenant lookups** — single DB query per render tree, not per component
3. **`tenantId` is on every customer-facing model** — correct, no gaps
4. **OrderItem carries its own `tenantId`** — dual fence prevents cross-tenant product attachment (noted in schema comment)
5. **Order intentionally NOT cascade-deleted** — preserving financial records is correct

### Scale Analysis

| Tenant Count | Risk | Notes |
|-------------|------|-------|
| 2-10 | None | Trivial — all queries instant with indexes |
| 100 | Low | Product index on `(tenantId, categoryId)` keeps queries fast |
| 1,000 | Medium | Connection pool pressure, index maintenance cost, need query monitoring |

**What actually breaks at scale:**
- **Noisy neighbor at 1,000 tenants:** One tenant running a bulk import with 10K products blocks PgBouncer slots for others
- **Missing tenantId in a query:** No guardrail beyond code review — a bug in one admin endpoint could leak cross-tenant data
- **Single point of failure:** One Supabase DB outage takes all tenants offline

### Tenant Data Isolation Risk

**Critical gap:** Prisma has no built-in enforcement of tenantId on queries. If any route handler forgets to include `where: { tenantId }`, it silently returns cross-tenant data.

**Mitigation options:**
1. **Prisma Client Extension** — wrap `prisma` with a tenant-scoped helper that auto-injects `tenantId` on all queries:
   ```ts
   // Not code — architecture note
   // tenantPrisma(tenantId).product.findMany() always adds WHERE tenantId = X
   ```
2. **PostgreSQL Row Level Security (RLS)** — Supabase supports this. Set current tenant in session variable, RLS policy enforces it at DB level. Belt-and-suspenders.
3. **Code review policy** — require `tenantId` in every Prisma query, enforced via PR review

**Recommendation for Phase 3:** Implement a `tenantPrisma(tenantId)` Prisma Client Extension. This is the pragmatic middle ground — enforces isolation in application code without the operational complexity of per-tenant schemas.

### Alternative: Separate Schemas or Databases

**Per-tenant PostgreSQL schema (e.g., `public.tenant_abc.products`):**
- Prisma multi-schema support exists but is experimental
- Migration management becomes O(n tenants) — a nightmare
- No upside at <1,000 tenants

**Per-tenant database:**
- Supabase doesn't support this on free tier
- Operational complexity is massive
- Only justified at 10,000+ tenants or strict compliance requirements (GDPR isolation)

**Verdict: Single DB with tenantId is the right choice for this project indefinitely.**

---

## 5. FRONTEND ARCHITECTURE — DC FRAMEWORK → NEXT.JS

### Component Split Recommendation

```
Server Components (can query Prisma directly):
  - All page layouts
  - Product listings (shop page)
  - Product detail pages
  - Category navigation
  - Hero section (content from tenant theme)
  - Order history page (customer)
  - Admin dashboard stats
  - Catering inquiry list (admin)

Client Components ("use client"):
  - CartButton and CartOverlay (Zustand state)
  - AddToCartBtn (onClick → Zustand action)
  - HamburgerMenu (open/close state)
  - MobileTabBar (active tab state)
  - ProductFilter (search + category filter — local state)
  - AdminProductForm (file upload, real-time preview)
  - SweetAlert2 confirm dialogs
```

### Replacing Hardcoded Product Array

DC framework has 15 hardcoded products as a JS array. Replacement pattern:

```
// Server Component
const products = await prisma.product.findMany({
  where: { tenantId, deletedAt: null },
  include: { category: true },
  orderBy: { createdAt: 'desc' }
})
```

The `sc-for` directive maps directly to `.map()` in JSX.  
The `sc-if` directive maps to conditional rendering (`&&` or ternary).  
The `x-import` directive maps to standard Next.js component imports.

### State Management

Zustand for cart is correct. Observations:
- Cart state should be persisted to `localStorage` (Zustand `persist` middleware)
- Cart is 100% client-side until checkout — no server involvement until Stripe session
- No other cross-component state identified — no other Zustand stores needed

### Mobile Patterns

DC framework has two distinct mobile patterns:
- **Storefront**: hamburger menu + full-page overlay nav + bottom quick-cart bar
- **Admin**: bottom tab bar (4 tabs) + stacked card layouts

Both are straightforward React component implementations. The tab bar active state lives in client component local state (`useState`), not Zustand (it's purely UI, not shared data).

### ISR Strategy

Product pages are good ISR candidates:
- `revalidate = 3600` (1 hour) for product listing pages
- `revalidate = 86400` (24 hours) for product detail pages
- Admin mutations should call `revalidatePath()` after product updates

This eliminates cold-start latency for storefront pages entirely.

---

## 6. EMAIL / NOTIFICATIONS

### Provider Comparison

| Provider | Free Tier | Cost at 10K/mo | React Email | NextAuth support | Lock-in |
|----------|-----------|----------------|-------------|------------------|---------|
| Resend | 3,000/mo (100/day) | $20/mo | Native | Plugin available | Low |
| SendGrid | 100/day = 3,000/mo | $19.95/mo | Via SDK | Plugin available | Medium |
| Brevo | 300/day = 9,000/mo | $25/mo | Via template | Manual | Medium |
| Postmark | 100/month total | $15/mo | Via handlebars | Manual | Low |

### Integration Pattern

**Resend is the clear winner for DX:**
```ts
// app/api/webhooks/stripe/route.ts (server-side only)
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'Jazy\'s House <orders@jazyshouse.com>',
  to: order.email,
  subject: 'Your order is confirmed',
  react: OrderConfirmationEmail({ order }) // React Email component
});
```

Triggers:
- **Order confirmation**: Stripe webhook `checkout.session.completed`
- **Catering inquiry ACK**: Server Action on form submit
- **Password reset**: NextAuth built-in email provider or custom flow

**For budget target:** Resend's 3,000/mo free tier covers:
- 1K orders × 1 confirmation = 1,000 emails
- 100 catering inquiries × 2 (ACK + reply) = 200 emails
- 50 password resets = 50 emails
- Total: ~1,250/mo — well within 3,000 limit

### Brevo as Alternative

If volume exceeds 3,000/mo before revenue: Brevo's 9,000/mo free tier buys significant headroom. The API is similar to Resend but requires HTML templates rather than React components. Acceptable trade-off.

---

## RECOMMENDATIONS SUMMARY

| Area | Decision | Cost at Launch | Cost at 10× | Setup Hours |
|------|----------|----------------|-------------|-------------|
| Image Storage | Cloudflare R2 | £0/mo | ~£2/mo | 4h |
| Database | Supabase (stay) | £0/mo | £0-20/mo | 0h |
| Backups | GitHub Actions + pg_dump → R2 | £0/mo | £0/mo | 2h |
| Hosting | Vercel (stay) | £0/mo | £0-20/mo | 0h |
| Multi-tenant | Single DB + tenantPrisma extension | £0/mo | £0/mo | 3h |
| Email | Resend | £0/mo | £20/mo | 2h |
| **TOTAL** | | **£0/mo** | **~£42/mo** | **~11h** |

### Phase 3 Build Order (Infrastructure-First)

1. **Set up Cloudflare R2** — before admin product form can be built
2. **Add DATABASE_URL pgbouncer params** — before load testing
3. **Add db-backup GitHub Action** — before any real data is stored
4. **Create tenantPrisma extension** — before any Phase 3 routes are written
5. **Set up Resend** — can be parallel with storefront build
6. **Audit serverless route count** — before adding more API routes
