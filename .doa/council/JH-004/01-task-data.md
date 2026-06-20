# JH-004 — Council Brief: Infrastructure, Architecture & Cost Optimization

**Ticket:** JH-004
**Type:** Architecture Review + Infrastructure Planning
**Date:** 2026-06-19
**Chair:** Prime Kang (Hermes)
**Urgency:** Before Phase 3 storefront build proceeds

## Background

Jazy's House Platform has completed Phases 1-2 (Foundation + Admin Dashboard). A new comprehensive UI framework has been delivered as a DC-bundled HTML app (`Jazys House App (1).html`) that covers:

- **Desktop Storefront:** Home (hero, featured, categories, catering teaser), Shop (filterable product grid with cart)
- **Desktop Admin:** Dashboard (stats + recent orders), Products (searchable list with stock badges), Orders (status-filterable), Catering (inquiry cards), Customers (list), Settings (store name + theme)
- **Mobile Storefront:** Full mobile layout with hamburger menu, compact product cards, cart overlay
- **Mobile Admin:** Bottom tab bar (4 tabs), stacked card layouts, mobile-optimized inputs
- **Design System:** Marcellus (headings) + Hanken Grotesk (body), terracotta (#c0563d) primary, cream (#f6efe4) bg, fully rounded buttons, glass-morphism header

This framework must now be implemented as a real Next.js application. Before building, the council needs to review and ratify the infrastructure and architecture decisions.

## Questions for the Council

### 1. Image Storage — Cheapest Viable Option
We have 63 product images (from the static site) and users will upload more. Requirements:
- Cheap/free tier sufficient for launch
- No egress fees (users browse product images constantly)
- Works with Next.js `next/image`
- Supports user uploads from admin

**Candidate options to evaluate:**
| Option | Free Tier | Egress | Upload API | Notes |
|--------|-----------|--------|------------|-------|
| Cloudflare R2 | 10GB | FREE | S3-compatible | Best for bandwidth |
| Vercel Blob | 10GB | Included | Native SDK | Best DX, Vercel-locked |
| Cloudinary | 25GB | 25GB/mo | Widget/API | Best for transforms |
| Supabase Storage | 1GB | 5GB/mo | S3-compatible | Already in stack |
| BunnyCDN | $0.01/GB | Cheap | FTP/API | Geo-replicated |

### 2. Database — Current Setup Review
- **Current:** Prisma + PostgreSQL on Supabase free tier (500MB DB)
- **Question:** Is 500MB enough for launch? What's the growth plan?
- **Alternatives:** Neon (0.5GB free), PlanetScale (5GB free but MySQL)

### 3. Hosting / Deployment
- **Current plan:** Vercel free tier (100GB bandwidth, 6000 build mins)
- **Question:** Is Vercel free tier sufficient? Any hidden costs?
- **Alternatives:** Cloudflare Pages (unlimited bandwidth), Netlify

### 4. Multi-Tenant Architecture
- **Current:** x-tenant-host header → Prisma tenant lookup → tenantId on all queries
- **Question:** Is this solid for 2 tenants? 10 tenants? 100 tenants?
- **Risk:** Single DB for all tenants — no noisy-neighbor protection

### 5. Payment Processing
- **Current:** Stripe (server-side Checkout sessions, test mode)
- **Question:** Stripe Connect for multi-tenant? Or shared Stripe account with metadata tagging?

### 6. Frontend Architecture — DC Framework → Next.js
The DC framework is a single HTML file with inline React-like templates (`sc-if`, `sc-for`, `x-import`). It needs to be rewritten as proper Next.js components.
- **Question:** Server Components vs Client Components split?
- **Data flow:** How to replace hardcoded product data with Prisma queries?

### 7. PWA & Offline
- **Question:** Service worker strategy? Workbox or next-pwa?
- **Offline:** What should work offline? Browse products? Cart?

### 8. Email / Notifications
- **Question:** Transactional email for orders? Provider?
- **Cheap options:** Resend (100/day free), SendGrid (100/day free), Brevo (300/day free)

## Budget Constraint

**Total monthly budget target: £0-5/mo** (free tiers everywhere). The platform is pre-revenue. Every dollar matters.

## Files for Review

- `.doa/COUNCIL-REFERENCE.md` — Council protocol
- `.doa/plans/JH-001-plan.md` — Master implementation plan (Phases 1-6)
- `STYLE-GUIDE.md` — Design system extracted from DC framework
- `CLAUDE.md` — Claude Code context
- `CODING-STANDARDS.md` — Coding standards
- `prisma/schema.prisma` — Database schema (7 models)
- `package.json` — Dependencies
- **DC Framework:** `C:\Users\Tevin\Downloads\Jazys House App (1).html` (1.6MB, working demo)
- **DC Framework v1:** `C:\Users\Tevin\Downloads\Jazys House App.html` (1.6MB, earlier version)

## Council Seats & Prompts

### Seat 1 (Claude Code) — Investigation
"Investigate the Jazy's House Platform infrastructure. Review: prisma/schema.prisma, package.json, middleware.ts, lib/db.ts, lib/stripe.ts. The platform is a multi-tenant Next.js + Prisma + PostgreSQL e-commerce app for African fashion/food. We need: (1) cheapest viable image storage for 63+ product images with user uploads, (2) database scalability assessment — is Supabase 500MB enough?, (3) Vercel free tier suitability, (4) multi-tenant architecture robustness. Budget target: £0-5/mo total. Write findings to JH-004/claude-investigation.md."

### Seat 3 (Codex CLI) — Think
"Review the attached investigation. Analyze: (1) architectural gaps in multi-tenant design, (2) cost optimization opportunities the investigation missed, (3) scaling risks — what breaks at 10 tenants? 100 tenants? 1000 products?, (4) image storage — rank options by cost + DX + scale. Budget target: £0-5/mo. Write to JH-004/codex-think.md."

### Seat 4 (Pi — The Maker) — Synthesis
"Synthesize the infrastructure findings for Jazy's House Platform. Perspectives: Developer (Tevin — wants cheap, stable, easy deploys), Store Owner (Dienaba — wants fast image uploads, order notifications), Customer (Aminata — wants fast image loading, no broken pages). Read claude-investigation.md and codex-think.md. Write to JH-004/maker-synthesis.md."

### Seat 5 (agy — The Adversary) — Security
"Adversarial audit of Jazy's House Platform infrastructure plan. Focus: (1) Stripe key security — are secrets isolated per tenant?, (2) Image upload attack surface — arbitrary file upload?, SSRF via image URLs?, (3) Multi-tenant data isolation — can tenant A access tenant B's orders?, (4) Prisma query injection risks. Write to JH-004/adversary-audit.md."

### Seat 6 (Pi — The Archivist) — Patterns
"Pattern check for Jazy's House Platform JH-004. Review all artifacts. Track: (1) consistent patterns vs one-offs in architecture decisions, (2) anti-patterns from ClubRight that should not repeat here, (3) cross-session lessons — what did JH-001/JH-002 teach us about infra choices? Write verdict to JH-004/archivist-verdict.md."
