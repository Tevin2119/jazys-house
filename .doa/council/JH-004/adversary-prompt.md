# JH-004 — Adversary Audit Prompt (agy CLI)

You are Seat 5 (THE ADVERSARY — Lex Luthor). Security audit the proposed infrastructure.

Read all available artifacts in .doa/council/JH-004/.

## Audit Vectors

### 1. Image Upload Security
- If we use Cloudflare R2 with presigned URLs — can an attacker enumerate uploads?
- File type validation: server-side or client-side? What stops someone uploading a .php file?
- Image size limits: what prevents a 500MB upload from blowing the free tier?
- SSRF via image URL input: if admin can paste an image URL, can they hit internal services?

### 2. Multi-Tenant Data Isolation
- Walk through the Prisma query patterns: is tenantId ALWAYS filtered?
- Edge case: what if middleware fails to resolve tenant? Does the request proceed as tenant=null?
- Admin multi-tenant: can a TENANT_ADMIN of store A access store B's orders?
- Stripe webhooks: do they carry tenant context? How do we route webhooks to the right tenant?

### 3. Database Security
- Supabase free tier: is the DB publicly accessible? IP restrictions?
- Connection string in .env — any risk of it leaking to client?
- Prisma $queryRaw / $executeRaw usage — any raw SQL that could be injected?

### 4. Authentication & Authorization
- NextAuth v5 JWT — what's in the token? Can a user escalate from CUSTOMER to TENANT_ADMIN?
- Password hashing: bcryptjs with sufficient rounds?
- Session management: JWT expiry? Refresh tokens? What if JWT is stolen?

### 5. Supply Chain
- npm dependencies: run `npm audit`. Any HIGH/CRITICAL vulnerabilities?
- Prisma client generation: any risk from generated code?
- Stripe SDK version: is it current?

## Output
- List each vulnerability with severity (CRITICAL/HIGH/MEDIUM/LOW)
- For each: exploitation scenario, fix recommendation
- "I found your kryptonite" — top 3 most dangerous findings
- Write to .doa/council/JH-004/adversary-audit.md
