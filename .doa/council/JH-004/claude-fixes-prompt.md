# JH-004 — Claude Code: Implement Council Fixes (9 shields)

You are Seat 1 (Workhorse Kang). The council deliberated JH-004 and returned NO-GO with 9 must-fix items before Phase 3 can proceed. Your job: implement ALL 9 fixes.

## FIXES TO IMPLEMENT

### Fix 1 (CRITICAL): Sanitize tenant headers in middleware
File: src/middleware.ts
Problem: middleware clones request.headers without stripping incoming x-tenant-slug/x-tenant-host. Attacker can send their own header and hijack tenant context.
Fix: Add requestHeaders.delete("x-tenant-slug") and requestHeaders.delete("x-tenant-host") BEFORE setting server-derived values. Add comment explaining the security rationale.

### Fix 2 (CRITICAL): Add TenantMembership model
File: prisma/schema.prisma
Problem: User.tenantId is single-valued — one user can't belong to multiple tenants.
Fix: Add TenantMembership model with userId, tenantId, role (per-tenant role). Add memberships[] relation on User and Tenant models. Keep existing User.tenantId for backward compat. Use @@unique([userId, tenantId]).

### Fix 3 (CRITICAL): Create tenantDb() Prisma extension
New file: src/lib/tenant-db.ts
Problem: No engineering control against forgotten tenantId filters. Code review alone can't prevent cross-tenant data leaks.
Fix: Create tenantDb(tenantId) function using Prisma $extends. Auto-inject tenantId on ALL queries (findMany, findUnique, create, update, delete, upsert, etc.) for these models: product, category, order, orderItem, cateringInquiry, newsletterSignup. Models NOT auto-filtered: tenant, user, tenantMembership.

### Fix 4: Create Prisma migration
Run: npx prisma migrate dev --name jh004_tenant_membership_and_shields
This commits the schema changes to a migration file. Note: if DB is unreachable, create the migration SQL manually.

### Fix 5: GitHub Actions DB backup
New file: .github/workflows/db-backup.yml
Daily at 2am UTC: pg_dump → gzip → upload to Cloudflare R2. Uses GitHub secrets for R2 credentials. Document the required secrets in a comment.

### Fix 6: Document Vercel quotas
New file: docs/vercel-quotas.md
Verify current Vercel Hobby limits (June 2026). Count current routes — we have ~8 of 12. Document the 12-route limit as the tightest constraint. Note bandwidth is safe (images on R2).

### Fix 7: Restrict image upload URLs
File: src/app/(admin)/admin/products/actions.ts, function parseProductForm
Problem: image URL validation only checks http/https protocol. No domain allowlist = SSRF risk.
Fix: Add ALLOWED_IMAGE_HOSTS regex array (r2.dev, cloudflarestorage.com, supabase.co, cloudinary.com, vercel-storage.com). Add isAllowedImageUrl() helper that also blocks private IPs (10.x, 172.16-31.x, 192.168.x, 127.0.0.1, localhost, 169.254.169.254). Change filter to use this helper.

### Fix 8: Document Stripe model
New file: docs/stripe-model.md
Document the shared Stripe account + metadata decision. Justify why NOT Connect for 2-10 tenants. Define migration path to Connect when needed.

### Fix 9: Document monitoring setup
New file: docs/monitoring.md
UptimeRobot free (50 monitors, 5-min). 4 monitors: root storefront, /shop with keyword check, /login, /api/health. Include health route code spec. Note Vercel Analytics is analytics, not alerting.

## RULES
- Read existing files before editing — understand the codebase
- Write clean, commented code matching existing patterns
- Run npm run build after all changes — fix any errors
- Write summary to .doa/council/JH-004/claude-implementation.md
- DO NOT commit. This is council work.
