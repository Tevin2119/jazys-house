Wrote `.doa/council/JH-004/archivist-verdict.md`.
the council artifacts. The architecture is mostly sane, but the council repeated old sins: weak guardrails, stale assumptions, and too much trust in convention.

## Pattern Check

### 1) Repeating anti-patterns
- **Convention over enforcement**: same old “tenantId everywhere” comfort blanket. JH-001 already proved one missed fence can break isolation.
- **Placeholder execution**: Seat 1 and Seat 3 left no substantive artifacts. That is the classic council failure mode: activity without deliverable.
- **Deferred hardening**: backups, monitoring, migration discipline, and upload validation are treated as “later.” That is how later becomes outage.
- **Shared-secret thinking**: Stripe, tenancy, and uploads are still being framed as one global system with metadata tags. Doom has seen this before. It ends in leaks.

### 2) Consistency with the codebase
Mostly consistent:
- **Single Postgres + Prisma + Next.js** matches the current stack.
- **Tenant-scoped data model** matches the schema’s design.
- **Server Components for data, Client Components for cart/UI** matches the App Router pattern.
- **Tailwind/shadcn** is unaffected by infra choice.

Inconsistent / risky with the current codebase:
- **Cloudflare Pages/Workers** would fight Prisma + NextAuth + the current Node-first design.
- **Separate schemas / separate DBs** are overkill for this project and break the present operational simplicity.
- **Arbitrary image URLs** do not fit a safe Next.js image pipeline without strict allowlists.

### 3) Knowledge gaps
What the council missed that Doom has seen before:
- **User ↔ tenant membership**: `User.tenantId` is a dead end if one person can manage multiple stores.
- **Backup reality**: free DB tiers without backups are not “fine for launch.” They are an accident waiting for a Friday.
- **Real quota checking**: Vercel/free-tier assumptions age badly. Verify the current limits, not folklore.
- **Operational visibility**: uptime monitoring is not analytics.
- **Upload abuse**: image intake needs file type, size, and host allowlists before it becomes a liability.

### 4) Technical debt seeds
These decisions plant future crises:
- Shared Stripe account + metadata only.
- No committed migration/deploy pipeline.
- No automated DB backup.
- No explicit tenant membership model.
- No hard tenant-scoping guardrail in the data layer.
- “We’ll fix it after Phase 3.” No. That is how Phase 4 inherits Phase 3’s corpse.

## Accountability

### Seat 1 — Claude / Workhorse: **1/5**
Investigation quality was effectively absent in the artifact set. If the seat cannot produce a durable finding, it did not investigate.

### Seat 2 — OpenCode / Swarm: **4/5**
Best of the bunch. It identified missing source artifacts, checked tenancy paths, and flagged stale quota assumptions. Solid validation discipline.

### Seat 3 — Codex / Thinker: **1/5**
No substantive gap analysis was delivered. A prompt transcript is not a think piece.

### Seat 4 — Maker / Pi: **3/5**
Useful synthesis, but it rested on missing inputs and skipped the hardest parts: tenant membership, migration flow, and backup discipline.

### Seat 5 — Adversary / agy: **4/5**
Good security instincts: tenant header injection, shared Stripe risk, SSRF/image input concerns. Some claims need verification, but the warnings are directionally correct.

## Verdict

**NO-GO** on the infrastructure plan as-is.

**Risk level: HIGH**

### Must-fix before Phase 3
1. **Lock tenant resolution**: sanitize/override any client-supplied tenant headers; trust server-derived host mapping only.
2. **Add a real tenant membership model** if one user can manage multiple tenants.
3. **Enforce tenant scoping in the data layer** (extension or RLS), not just by code review.
4. **Commit Prisma migrations and run `migrate deploy` in CI/production**; no production `db push` habits.
5. **Add automated backups now**.
6. **Verify current Vercel/Hobby quotas** before planning around stale numbers.
7. **Restrict image uploads** to approved providers, file types, and size limits.
8. **Define the Stripe model explicitly**: shared account only if the platform is the merchant-of-record; otherwise Connect later.
9. **Add uptime monitoring**; analytics is not alerting.

Doom’s conclusion: the stack choice is acceptable, but the council is still building on assumptions instead of shields. Fix the shields first.

**Doom has archived this. It will not be forgotten.**