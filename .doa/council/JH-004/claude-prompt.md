# JH-004 — Claude Code Investigation Prompt

You are Seat 1 (Workhorse Kang) on the Jazy's House Platform council. This is an ARCHITECTURE REVIEW — investigate infrastructure options, do NOT write code.

## PROJECT CONTEXT
- Multi-tenant e-commerce platform for African fashion/food/catering
- Stack: Next.js 15 App Router, Prisma ORM, PostgreSQL (Supabase), Stripe, Tailwind + shadcn/ui
- Current phase: Phase 2 (Admin Dashboard) complete. Storefront UI framework delivered (DC-bundled HTML with desktop+mobile storefront AND admin, 15 products, Marcellus + Hanken Grotesk fonts, terracotta/cream palette)
- Council ticket JH-004: Infrastructure & Architecture decisions before Phase 3 build

## TASK: Investigate these 6 areas. Write findings to .doa/council/JH-004/claude-investigation.md

### 1. IMAGE STORAGE — Find the cheapest viable option
Requirements:
- 63 existing product images + user uploads from admin
- Must work with Next.js `next/image` (remote patterns or custom loader)
- User upload from admin product form
- Budget target: £0/mo at launch

Evaluate and rank these:
- Cloudflare R2 (10GB free, zero egress, S3 API)
- Vercel Blob (10GB free, native Next.js SDK)
- Cloudinary (25GB free, 25GB bandwidth, image transforms built-in)
- Supabase Storage (1GB free, already in stack)
- BunnyCDN (pay-as-you-go, ~$0.01/GB, geo-replicated)

For each: write the exact setup steps, pricing at 100GB storage + 500GB bandwidth, and Next.js integration code sample.

### 2. DATABASE — Assess Supabase free tier viability
- Read prisma/schema.prisma — 7 models
- Calculate: how many rows = 500MB? Run the numbers.
- Connection pooling: Vercel serverless + Prisma = connection exhaustion? Is pgbouncer enough?
- What happens at 10 tenants? 100 tenants? 1000 products each?
- Is there a better free tier? (Neon 0.5GB, PlanetScale 5GB but MySQL)
- CRITICAL: Supabase free has NO backups. What's the cheapest backup strategy?

### 3. HOSTING — Vercel free tier deep-dive
- Limits: 100GB bandwidth, 6000 build mins, 12 function routes, 10s execution timeout
- Cold starts on free tier — impact on storefront?
- Custom domain support on free tier?
- Edge middleware for tenant resolution — runs at edge, NOT serverless (costs less)
- Alternative: Cloudflare Pages (unlimited bandwidth, 500 builds/mo) — trade-offs?

### 4. MULTI-TENANT ARCHITECTURE
- Current: single DB, tenantId on every table, x-tenant-host header resolution
- Is this solid for production? What breaks at scale?
- Alternative evaluated: separate schemas per tenant? separate DBs?
- Prisma multi-schema support?
- Tenant isolation: can a bug in admin code expose another tenant's data?

### 5. FRONTEND ARCHITECTURE — DC Framework → Next.js
The DC framework uses inline React-like templates (sc-if, sc-for, x-import) with a state class. Read the decoded template (will be provided).
- Server vs Client component split: what should be server-rendered?
- Data flow: how to replace hardcoded product array with Prisma queries?
- State management: Zustand for cart (already planned) — confirm
- Mobile: bottom tab bar + hamburger — native Next.js patterns?

### 6. EMAIL / NOTIFICATIONS — Cheapest transactional email
- Required: order confirmation, catering inquiry reply, password reset
- Evaluate: Resend (100/day free, React Email), SendGrid (100/day free), Brevo (300/day free), Postmark (100/month free)
- Integration pattern with Next.js API routes

## RULES
- DO NOT write implementation code. This is research + analysis.
- Every recommendation must include: cost at launch, cost at 10× scale, setup effort (hours), lock-in risk
- Budget: £0-5/mo total. Ruthlessly eliminate anything that adds cost.
- Write findings to .doa/council/JH-004/claude-investigation.md
- Format: clear sections, tables where appropriate, concrete recommendations with rationale
