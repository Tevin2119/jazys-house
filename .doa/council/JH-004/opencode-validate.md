# JH-004 — OpenCode Validation

Seat 2: Swarm Kang  
Date: 2026-06-19  
Budget constraint: £0-5/mo

## Source Integrity

The requested inputs are not usable as completed investigations:

| File | Finding |
|---|---|
| `.doa/council/JH-004/claude-investigation.md` | Empty file: 0 lines. There are no claims or recommendations to validate. |
| `.doa/council/JH-004/codex-think.md` | Only contains the Codex prompt transcript. Lines 14-31 are the prompt text, not Codex's analysis. There are no recommendations to validate. |

Exact citations:

- `codex-think.md:14-24` lists the questions Codex was asked.
- `codex-think.md:26-30` lists the rules Codex was given.
- `codex-think.md:31` is blank/end of captured prompt content.
- `claude-investigation.md` has no line references because the file is empty.

Because both primary artifacts are missing, I validated against the project brief, docs, and current code instead of validating completed Claude/Codex conclusions.

## 1. Factual Errors

No factual errors can be attributed to Claude or Codex because their actual recommendation files contain no substantive claims.

Factual issues in the broader JH-004 prompt/brief to watch:

| Claim | Source | Validation |
|---|---|---|
| "Vercel free tier (100GB bandwidth, 6000 build mins)" | `01-task-data.md:45`, `claude-prompt.md:38` | Potentially stale. Current Vercel pricing has shifted to resource-specific Hobby quotas: 4h active CPU, 360 GB-hours provisioned memory, 1M invocations, 5K image transformations/month, 300K image cache reads/month, and 50K Web Analytics events/month. Do not plan around the old single 100GB/6000-min headline without rechecking the billing page. |
| "Vercel Blob (10GB free)" | `01-task-data.md:34`, `claude-prompt.md:22` | Needs recheck before selection. Vercel Blob pricing is now regional/resource based in Vercel docs, not just a simple 10GB-free line item. Under a £0-5/mo budget, avoid choosing Blob solely on the old free-tier assumption. |
| "Cloudflare R2 10GB free, zero egress" | `01-task-data.md:33`, `claude-prompt.md:21` | Zero egress and S3-compatible API remain correct. The exact free included storage/operation limits should still be checked at setup time, but the strategic point is valid: R2 avoids image-read egress charges. |
| "Resend (100/day free)" | `01-task-data.md:69`, `claude-prompt.md:60` | Correct enough: Resend Free is 3,000 transactional emails/month and limited to 100/day. |
| "Supabase free tier (500MB DB)" | `01-task-data.md:40` | The repo is configured for Supabase/Postgres, but Supabase free limits change over time. Treat 500MB as a planning assumption, not a guarantee. Current docs in this repo already warn free projects pause after inactivity (`docs/supabase-setup.md:21-23`). |

## 2. Missing Options

The JH-004 brief considered Cloudflare R2, Vercel Blob, Cloudinary, Supabase Storage, BunnyCDN, Resend, SendGrid, Brevo, and Postmark (`01-task-data.md:30-37`, `01-task-data.md:67-69`). Good baseline, but these options are missing or underweighted:

Image storage / hosting:

| Option | Why consider it | Budget fit |
|---|---|---|
| Backblaze B2 + Cloudflare CDN | S3-compatible, cheap storage, commonly paired with Cloudflare caching. | Usually low cost, but not as clean as R2 if Cloudflare is already acceptable. |
| UploadThing | Excellent Next.js upload DX and validation. | Free tier may fit launch, but introduces another vendor and quota surface. |
| S3-compatible MinIO on cheap VPS | Portable and controllable. | Not worth ops burden for £0-5/mo launch. |
| Git/LFS/static public assets for the initial 63 images only | Zero extra service for seed/demo images. | Good temporary bootstrap, but not sufficient for admin user uploads. |
| Cloudflare Images | Built-in transformations and delivery. | Likely outside strict £0 unless quota/pricing fits; worth comparing against Cloudinary if transforms matter. |
| ImageKit | Image CDN/transforms with easy URLs. | Could fit small launch, but another lock-in/provider to manage. |

Email providers:

| Option | Why consider it | Budget fit |
|---|---|---|
| AWS SES | Cheapest at scale, reliable deliverability when configured well. | Very cheap, but setup/DKIM/sandbox complexity is higher than Resend. |
| MailChannels via Cloudflare Workers | Sometimes used for low-cost transactional mail from Workers. | Only relevant if moving infra toward Cloudflare Workers; not the simplest Next/Vercel path. |
| Loops | Better for lifecycle/marketing-style emails. | Less focused on simple transactional budget launch. |
| MailerSend / Mailgun | Established alternatives. | Usually less attractive than Resend/Brevo for this exact budget and DX. |

Recommendation under £0-5/mo:

- Images: Cloudflare R2 first, Cloudinary second if transformations/admin upload widget outweigh egress risk, Vercel Blob third for DX only if current free quota is confirmed.
- Email: Resend first for Next.js DX and 100/day free cap; Brevo second if higher free daily volume matters more than developer experience; AWS SES only when volume forces it.

## 3. Tenancy Risks: Crafted Tenant-B Product ID From Tenant A

Simulation: tenant A storefront sends a checkout request whose cart JSON contains tenant B's `productId`.

Code path:

1. `placeOrder` resolves tenant from the request host via `getCurrentTenant()` (`src/app/(store)/checkout/actions.ts:101-102`). The form does not supply a tenant ID.
2. Cart JSON is parsed into `{ productId, quantity }` only; client prices/names are ignored (`checkout/actions.ts:17-36`, `:110`).
3. `verifyCart(tenant.id, lines)` re-queries products with `where: { tenantId, deletedAt: null, id: { in: ... } }` (`src/lib/stripe.ts:46-61`).
4. If tenant B's product ID is supplied while request host resolves to tenant A, the product is not returned in the tenant A query. `byId.get(line.productId)` is undefined and `verifyCart` throws `Product not found for tenant: <id>` (`src/lib/stripe.ts:63-70`).
5. `placeOrder` catches the error and returns `{ ok: false, error: message }` before order creation or stock decrement (`checkout/actions.ts:122-170`).

Result: no tenant B product data is returned, no order is created, and no stock is mutated.

Additional tenant fences in checkout:

- Stock decrement uses `updateMany({ where: { id: i.productId, tenantId: tenant.id, stock: { gte: i.quantity } } })` (`checkout/actions.ts:130-142`).
- Order is created with `tenantId: tenant.id` and each `OrderItem` also gets `tenantId: tenant.id` (`checkout/actions.ts:144-160`).
- Stripe metadata carries `{ orderId, tenantId }` (`checkout/actions.ts:176-190`).
- Webhook validates session metadata tenant against the order tenant before mutation (`src/app/api/webhooks/stripe/route.ts:152-167`, `:186`).
- Webhook status update is tenant-scoped (`stripe/route.ts:191-203`).

Storefront read paths:

- Catalog categories/products are scoped by `tenantId` (`src/lib/storefront.ts:19-32`).
- Category filter resolves by compound tenant slug, not raw category ID (`storefront.ts:51-58`).
- Product detail fetch is `where: { tenantId, slug, deletedAt: null }` (`storefront.ts:72-78`).
- Confirmation page looks up orders by `stripeSessionId` or `orderId` plus `tenantId`, then redirects on no match (`src/app/(store)/checkout/confirmation/page.tsx:40-63`).

Admin paths:

- `getAdminContext()` pins tenant admins to `session.user.tenantId`; `activeTenantId` is only used for super admins (`src/lib/auth.ts:84-97`).
- Product create/update/delete/restore use the admin-context tenant and `updateMany({ id, tenantId })` for mutation (`src/app/(admin)/admin/products/actions.ts:77-151`).
- Category mutations are tenant-scoped (`src/app/(admin)/admin/categories/actions.ts:9-74`).
- Order detail query uses `where: { id, tenantId }` (`src/app/(admin)/admin/orders/[id]/page.tsx:85-92`).

Residual tenancy risks:

| Risk | Severity | Detail |
|---|---|---|
| `User.email` is globally unique | Medium | `User.email @unique` and nullable `tenantId` means one email cannot naturally belong to multiple tenant accounts (`prisma/schema.prisma:146-158`). This matches current single-home-tenant auth but blocks clean multi-tenant memberships. Add `TenantMembership` before onboarding owners who manage multiple stores. |
| Super-admin tenant switch accepts arbitrary `activeTenantId` | Low/Medium | In `src/auth.ts:81-84`, any super admin can set any active tenant ID. That is intended for platform admins, but invalid IDs are not validated before session claim update. `getAdminContext()` only checks presence, so some pages may show empty/not found data for invalid IDs. Not a tenant leak, but weak UX/auditability. |
| Image URL input only checks `http:`/`https:` | Medium | `parseProductForm` allows any HTTP(S) image URL (`products/actions.ts:35-45`). If later server-side fetching/transforms are added, this becomes SSRF risk. Prefer allowlisting R2/Cloudinary/Vercel Blob domains once provider is chosen. |
| No database row-level security | Low for current app, higher with direct DB clients | Isolation is enforced in application queries, not Postgres RLS. This is acceptable for a small Prisma app, but code review/tests must keep enforcing tenant filters. |

## 4. Stripe Multi-Tenant: Connect vs Shared Account + Metadata

For 2-10 tenants, shared Stripe account with tenant metadata is simpler.

Use shared Stripe account when:

- Jazy's House/platform is the merchant of record.
- Funds land in one Stripe account and payouts/accounting can be handled centrally.
- Tenants are internal brands, close partners, or stores operated by the same business.
- Budget and implementation simplicity matter more than tenant-owned Stripe dashboards.

Use Stripe Connect when:

- Each tenant is a separate legal merchant and must receive direct payouts.
- Each tenant needs its own Stripe account, tax/payment reporting, disputes, and compliance boundary.
- Platform fees/marketplace payouts are required.

Current code is already designed for shared account + metadata:

- One `STRIPE_SECRET_KEY` in `.env.example:13-17`.
- Checkout Session metadata includes `{ orderId, tenantId }` (`checkout/actions.ts:189-190`).
- Webhook enforces metadata tenant matches order tenant (`stripe/route.ts:152-167`).

Recommendation: for 2-10 tenants and £0-5/mo, keep shared Stripe account + metadata. Add Connect only when tenant-owned payouts become a real requirement. Connect adds onboarding, connected-account IDs per tenant, webhook account context, payout failure handling, and support burden.

## 5. Build/Deploy Pipeline: Vercel + Prisma Migrations

Current state:

- `package.json` build is `prisma generate && next build` (`package.json:7-17`).
- `vercel.json` build command is also `prisma generate && next build` (`vercel.json:1-8`).
- Production migration docs say run `npx prisma migrate deploy` manually (`docs/supabase-setup.md:120-128`, `README.md:151-154`).
- No `.github/workflows/*` files are present.
- No `prisma/migrations/**` files are currently present, so `migrate deploy` has no committed migration history to apply yet.

Recommended CI/CD flow under £0-5/mo:

1. Development: use `npm run db:migrate` when schema changes need a real migration, not `db:push`, once production data exists.
2. Commit `prisma/migrations/**` with the schema change.
3. Pull request checks: `npm ci`, `npm run typecheck`, `npm run build`. Add tests when available.
4. Production deploy: run `npx prisma migrate deploy` against production `DIRECT_URL` before Vercel promotes the app version.
5. Vercel build remains `prisma generate && next build`; do not run `migrate dev` in Vercel.

How to run migrations safely:

- Best cheap option: GitHub Actions on push to `main` runs `npx prisma migrate deploy` using GitHub environment secrets, then Vercel deploys. This costs £0 on normal GitHub free minutes for a small repo.
- Simple manual option: before production deploy, run `npx prisma migrate deploy` locally with production `DIRECT_URL`. This is acceptable early but easy to forget.
- Avoid: putting `prisma migrate deploy && next build` directly in Vercel build unless you accept failed deploys and migration side effects during build. Migrations should be an explicit deploy step, not hidden in static build.

Production DB URL rule:

- Runtime app uses pooled `DATABASE_URL` with PgBouncer (`docs/supabase-setup.md:33-49`).
- Migrations use `DIRECT_URL` session/direct connection (`docs/supabase-setup.md:51-80`).

## 6. Monitoring

The free stack has weak built-in alerting. Vercel Web Analytics is not uptime monitoring.

Recommended £0 monitoring setup:

| Need | Free option | Notes |
|---|---|---|
| Uptime alerts | UptimeRobot Free | 50 monitors, 5-minute interval, HTTP checks, basic status page. Use one monitor for root storefront and one for `/login` or a lightweight health route. |
| Vercel usage/performance visibility | Vercel Analytics Free | Hobby includes 50,000 Web Analytics events/month. Good for traffic and pages, not down alerts. |
| Payment failures | Stripe Dashboard + webhook logs | Current webhook logs payment failures/refunds (`stripe/route.ts:71-85`). Add email/Slack later if failures matter. |
| Error visibility | Vercel Function logs | Free/manual inspection only. Sentry free can be considered, but it adds SDK/config overhead. |
| Database availability | UptimeRobot synthetic checkout-light check or `/api/health` | A static homepage can be up while DB is down. Add a cheap health route that does a minimal Prisma query if monitoring needs DB coverage. |

Minimum launch monitoring:

1. UptimeRobot monitor for `https://<root-domain>/`.
2. UptimeRobot keyword monitor for a tenant storefront page containing stable text.
3. UptimeRobot monitor for `/login` or `/api/health` once a health route exists.
4. Enable Vercel Web Analytics for traffic trends, not incident alerts.
5. Check Stripe webhook delivery dashboard after first live payments.

## 7. Agreement Ratings With Claude And Codex

Cannot rate actual Claude/Codex recommendations because the requested artifacts do not contain any.

| Source | Recommendation | Agreement | Reason |
|---|---|---:|---|
| Claude | None present | N/A | `claude-investigation.md` is empty. |
| Codex | None present | N/A | `codex-think.md:14-31` is only the prompt transcript. |

Agreement with likely council direction from the brief/current synthesis:

| Recommendation | Agreement | Notes |
|---|---:|---|
| Use Cloudflare R2 for product images | 4/5 | Strong fit for image egress and portability. Need domain allowlist, signed upload flow, file size/type validation, and cache headers. |
| Keep single Postgres DB with tenantId scoping | 5/5 | Correct for 2-10 tenants and likely 100 tenants. Separate DB/schema is premature under £0-5/mo. |
| Use Vercel Hobby/free for launch | 4/5 | Best Next.js deploy DX, but watch current resource-specific Hobby quotas and image optimization limits. |
| Use Resend for transactional email | 4/5 | Best DX for order confirmations/password reset at launch. Brevo wins if free daily volume matters more. |
| Shared Stripe account + metadata for 2-10 tenants | 5/5 | Much simpler than Connect unless separate legal merchants/payouts are required. |
| Add TenantMembership before true multi-tenant user ownership | 5/5 | Current `User.tenantId` supports one home tenant only. This is the main auth-model gap. |

Strong disagreements:

- Do not rely on stale Vercel 100GB/6000 build-minute assumptions without checking current Vercel resource pricing.
- Do not use `prisma db push` for production once real orders exist; use committed migrations and `prisma migrate deploy`.
- Do not launch admin image uploads with arbitrary HTTP(S) URLs and no provider allowlist if server-side image fetching is added.

## Final Recommendation

Proceed with: Vercel Hobby, Supabase Postgres single DB, Cloudflare R2 for images, Resend for email, shared Stripe account with metadata, UptimeRobot Free for uptime. The main engineering safeguards before production are committed Prisma migrations, image upload validation/allowlisting, and a future `TenantMembership` model before multi-tenant users become real.

## Docs Consulted

- `CODING-STANDARDS.md`
- `docs/supabase-setup.md`
- `docs/stripe-setup.md`
- Vercel pricing docs, Cloudflare R2 product page, UptimeRobot pricing, Resend pricing
