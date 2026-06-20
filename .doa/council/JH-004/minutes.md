# JH-004 — Council Minutes

**Date:** 2026-06-19
**Ticket:** JH-004 — Infrastructure & Architecture Review
**Seats convened:** 6 of 7 (Codex — partial/ineffective)
**Status:** NO-GO with conditions

---

## Roll Call

| # | Seat | Agent | CLI | Rating | Verdict |
|---|------|-------|-----|--------|---------|
| 0 | Prime Kang | Hermes | — | Chair | Orchestrated |
| 1 | Workhorse | Claude Code | 2.1.178 | 1/5 | Investigation empty — no durable artifact |
| 2 | Swarm | OpenCode | 1.17.7 | 4/5 | Best of the bunch — validated code paths, flagged stale assumptions |
| 3 | Thinker | Codex CLI | 0.137.0 | 1/5 | 156KB transcript, no structured analysis |
| 4 | Maker | Pi | 0.79.6 | 3/5 | Useful synthesis but skipped migration/backup/membership |
| 5 | Adversary | agy | 1.0.10 | 4/5 | Found critical: tenant header injection, shared Stripe risk, SSRF |
| 6 | Archivist | Pi | 0.79.6 | 4/5 | NO-GO verdict — 9 must-fix items before Phase 3 |

---

## Decisions Ratified

| Decision | Recommendation | Seats Agreeing |
|----------|---------------|----------------|
| Image Storage | **Cloudflare R2** (zero egress, S3 API, £0 launch) | Maker, OpenCode, Adversary, Archivist, Claude |
| Database | **Single Postgres + tenantId scoping** (stay on Supabase) | Unanimous |
| Hosting | **Vercel Hobby/free** (stay — best Next.js DX) | Maker, OpenCode, Claude |
| Email | **Resend** (3,000/mo free, React Email, best DX) | Maker, OpenCode, Claude |
| Tenant Model | **Host header + shared DB + TenantMembership table** | Maker, OpenCode, Archivist |
| Stripe | **Shared account + metadata** for 2-10 tenants (Connect later) | OpenCode, Adversary, Archivist |
| Monitoring | **UptimeRobot free** (50 monitors, 5-min checks) | OpenCode |
| Backups | **GitHub Actions + pg_dump → R2** (daily, £0) | Claude |

---

## Critical Fixes Required (Archivist's 9 Conditions)

1. 🔴 **Sanitize tenant headers** — strip x-tenant-slug/x-tenant-host from incoming requests in middleware (Adversary finding)
2. 🔴 **TenantMembership model** — replace single User.tenantId with explicit membership table
3. 🔴 **Tenant scoping in data layer** — Prisma extension or RLS, not code review alone
4. 🔴 **Commit Prisma migrations** — run `migrate deploy` in CI, never `db push` in production
5. 🔴 **Automated DB backups** — GitHub Action + pg_dump → R2, daily
6. 🟠 **Verify Vercel quotas** — 12 route limit is tight, check current limits
7. 🟠 **Restrict image uploads** — provider allowlist, file type/size validation
8. 🟠 **Define Stripe model** — document shared-account decision, plan Connect migration path
9. 🟡 **Add uptime monitoring** — UptimeRobot on storefront + login + health route

---

## Cost Summary

| Item | Launch (£/mo) | 10× Scale (£/mo) |
|------|---------------|-------------------|
| Hosting (Vercel) | £0 | £0-20 |
| Database (Supabase) | £0 | £0-20 |
| Image Storage (R2) | £0 | ~£2 |
| Email (Resend) | £0 | £20 |
| Backups (GitHub+R2) | £0 | £0 |
| Monitoring (UptimeRobot) | £0 | £0 |
| **TOTAL** | **£0** | **~£42** |

---

## Council Verdict

**NO-GO on the infrastructure plan as-is.** The stack choice is correct (R2 + Supabase + Vercel + Resend + shared Stripe), but the plan must be hardened with the 9 must-fix items before Phase 3 storefront implementation begins.

**Doom has archived this. It will not be forgotten.**
