Done — wrote `.doa/council/JH-004/maker-synthesis.md`
nd Codex’s think file were empty, so this synthesis is grounded in the task brief, current Prisma schema, and the project constraints.

## Clear Recommendations

| Decision area | Recommendation | Why |
|---|---|---|
| Image storage | **Cloudflare R2** | Zero egress, S3-compatible, cheap at scale, and keeps product images fast via CDN. Best fit for mobile browsing. |
| Database | **Keep single PostgreSQL DB with tenantId scoping** | Simpler, cheaper, and right-sized for this project. Add a user↔tenant membership table for multi-tenant admins. |
| Hosting | **Vercel Hobby/free tier** | Best Next.js DX, deploy-and-forget stability, and enough headroom for launch. |
| Email | **Resend** | Easiest transactional email path for Next.js + reliable order confirmations on the free tier. |
| Tenant model | **Host/domain-based tenant resolution + shared DB + explicit memberships** | One app, one DB, clear tenant fences, and support for admins who belong to multiple tenants. |

## Persona fit

### Developer (Tevin)
- Wants cheap and stable: **R2 + Supabase Postgres + Vercel** stays near £0/mo.
- Hates lock-in: **R2 + Postgres** are portable; Vercel is the only notable lock-in.
- Comfortable with CLI/env/git: setup is manageable.

### Store Owner (Dienaba)
- Fast images on mobile: **R2 behind CDN** is the best balance of speed and cost.
- Uploads should be painless: use a simple admin upload flow with signed URLs.
- Payments must feel reliable: keep the stack boring and stable.

### Customer (Aminata)
- Mobile-first on 4G: image CDN + Next.js `next/image` is the right combo.
- Abandons slow checkout: avoid extra infra hops and keep hosting simple.
- Needs trust: transactional email via Resend supports order confirmation and professional receipts.

## Persona conflicts

- **Cheapest vs easiest:** Vercel Blob is easier, but R2 wins on egress and long-term cost.
- **Lowest ops vs lowest lock-in:** Vercel is easiest, but it is the most vendor-locked piece.
- **Quota vs DX in email:** Resend is cleaner to implement; other providers may offer higher free quotas.
- **Single DB vs “perfect isolation”:** separate DBs sound safer, but they add cost and complexity that this project does not need.

## Decision notes

### Image storage
Use **Cloudflare R2** for all product images and admin uploads. It is the best answer to the actual constraint: lots of image reads, little budget, and no desire to pay egress fees. Pair it with `next/image` remote patterns and a CDN-backed public asset URL.

### Database
Keep the current **single PostgreSQL database**. The schema already uses `tenantId` on customer-facing models, which is the correct pattern for a small multi-tenant store platform. Add a **TenantMembership** table so one user can belong to multiple tenants without overloading `User.tenantId`.

### Hosting
Use **Vercel Hobby** for launch. It is the least risky way to ship a Next.js 15 app quickly. The hidden cost is lock-in, not money.

### Email
Use **Resend** for transactional mail. It is enough for launch, has the simplest Next.js story, and supports the exact emails this product needs: order confirmation, catering replies, and password resets.

### Tenant model
Use **host header/domain mapping → tenant lookup → tenantId on every query**. Keep tenant enforcement in the data layer, not just in the UI. For admin access, resolve the active tenant from membership rather than hardcoding a single tenant per user.

## Final synthesis

The best overall shape is boring on purpose: **R2 for images, one Postgres database, Vercel for hosting, Resend for email, and a shared multi-tenant app with strict tenant scoping**. That combination keeps costs near zero, keeps the storefront fast on mobile, and avoids premature complexity. The one place to spend engineering effort is tenant safety: make tenant resolution and query scoping impossible to forget.

**The Children have spoken:** ship the simple, portable stack now, optimize for speed and trust, and only add complexity when real volume forces it.