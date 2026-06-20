# Monitoring Setup — Jazy's House Platform

**COUNCIL FIX (JH-004):** Free tier has no built-in alerting. UptimeRobot fills the gap at £0.

---

## UptimeRobot Free (50 monitors, 5-min interval)

### Required Monitors

| # | Type | Target | Checks |
|---|------|--------|--------|
| 1 | HTTP(s) | `https://<root-domain>/` | Storefront is up, returns 200 |
| 2 | Keyword | `https://<root-domain>/shop` | Page contains "Jazy's House" (confirms DB is serving data) |
| 3 | HTTP(s) | `https://<root-domain>/login` | Auth is up |
| 4 | HTTP(s) | `https://<root-domain>/api/health` | Health route (see below) |

### Health Route

Add a lightweight health endpoint that does a minimal Prisma query:

```ts
// src/app/api/health/route.ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
```

This confirms the DB connection is alive — a static page can be up while the DB is down.

### Alert Contacts
- Email: faye.dienaba@yahoo.com
- Integration: Telegram / Discord bot (UptimeRobot supports both free)

---

## Vercel Web Analytics (Hobby tier — 50K events/mo)

Enable in Vercel dashboard. Good for traffic trends, page views, and geography. NOT for downtime alerts — it's analytics, not monitoring.

---

## Stripe Dashboard

- Monitor webhook delivery status at https://dashboard.stripe.com/webhooks
- Check for failed deliveries after first live payments
- Stripe emails on webhook endpoint failures (configure in Stripe Dashboard)

---

## Future: Sentry (free tier — 5K errors/mo)

Add `@sentry/nextjs` when error tracking becomes important. Not needed at launch.
