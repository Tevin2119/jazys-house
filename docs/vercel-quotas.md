# Vercel Quota Verification — JH-004

**COUNCIL FIX (JH-004):** Verified against Vercel Hobby plan as of June 2026.

---

## Current Hobby Limits

| Limit | Hobby | Our Usage | Risk |
|-------|-------|-----------|------|
| Bandwidth | 100 GB/mo | Images on R2 (not Vercel) — ~5-10 GB | LOW |
| Build minutes | 6,000/mo | ~3 min/build × 30 days = ~90 min | LOW |
| Serverless function routes | 12 | Current: ~8 (auth, checkout, webhooks, admin API × 4) | **MEDIUM** |
| Function execution timeout | 10s (Hobby) | Stripe webhook processing < 2s | LOW |
| Deployments/day | 100 | ~2-5 in active dev | LOW |
| Concurrent builds | 1 | Single build queue — fine for solo dev | LOW |
| Web Analytics events | 50K/mo | Sufficient for launch | LOW |

## Route Count — The Danger Zone

The 12-route limit is the tightest constraint. Current routes:

```
1. /api/auth/[...nextauth]
2. /api/checkout
3. /api/webhooks/stripe
4. /api/admin/products (or /api/products)
5. /api/admin/orders
6. /api/admin/catering
7. /api/admin/categories
8. /api/contact (catering form)
```

At 8 routes — 4 slots remaining. Mitigation:

- Consolidate admin CRUD under `/api/admin/[resource]` with method-based routing (`switch(request.method)`)
- Server Actions (Phase 3 forms) do NOT count against this limit
- If we hit 12: upgrade to Pro ($20/mo) — 50 routes

## Image Optimization

`next/image` optimization counts toward the 1,000-image limit on Hobby. With product images on R2/CDN and `remotePatterns`, the optimization load is manageable.

## Recommendation

Stay on Hobby. Monitor route count. Upgrade to Pro only when:
- 12-routes limit is hit AND consolidation isn't enough
- OR bandwidth exceeds 100GB/mo
- OR need advanced analytics/commercial usage
