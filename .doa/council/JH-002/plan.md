# Council Plan -- JH-002: Deploy Prep

**Seat:** 4 (Claude Plan / Prime Kang direct)
**Date:** 2026-06-19
**Based on:** Investigation confirmed C1+C2 fixed. One HIGH item (H1) needs fixing.

---

## Plan

### Task 1: Fix H1 Race Condition (1 line)
**File:** `src/app/(admin)/admin/orders/actions.ts`
**Change:** Add status precondition to `updateMany` where clause:

```diff
  await prisma.order.updateMany({
-   where: { id, tenantId },
+   where: { id, tenantId, status: order.status },
    data: { status },
  });
```

This makes the status transition atomic: if another admin changed the status between `findFirst` and `updateMany`, the update does nothing (0 rows affected) and the caller retries.

### Task 2: Create vercel.json
**File:** `vercel.json` (may already exist)
**Content:** Standard Next.js Vercel config with:
- Build command: `prisma generate && next build`
- Install command: `npm install`
- Framework: nextjs
- Environment variable placeholders documented

### Task 3: Create deployment docs
**File:** `docs/deploy.md`
**Content:** Step-by-step Vercel deployment guide:
1. Push to GitHub
2. Import to Vercel
3. Set env vars (DATABASE_URL, DIRECT_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, AUTH_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, NEXT_PUBLIC_APP_URL)
4. Run migration: `npx prisma migrate deploy`
5. Seed: `tsx prisma/seed.ts`
6. Verify health

---

## Risk Assessment
- **Low risk:** H1 fix is a 1-line atomicity improvement. No behavioral change.
- **Low risk:** vercel.json addition is config-only, no code impact.
- **No risk:** deploy docs are documentation only.
