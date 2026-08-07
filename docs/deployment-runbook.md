# Production Deployment Runbook

## Release sequence

1. Confirm CI is green and dependency advisories are reviewed.
2. Verify a current successful backup and migration/rollback plan.
3. Apply migrations once from a controlled operator environment: `npm run db:deploy`.
4. Deploy the approved Vercel build.
5. Smoke test storefront, login, tenant selection, card checkout in Stripe test mode, signed webhook delivery, and readiness endpoint.
6. Monitor Vercel and Stripe dashboards for 30 minutes.

## Environment boundaries

- Development, preview, and production require separate Supabase projects and Stripe modes/accounts.
- Put live Stripe keys only in Vercel Production.
- Create an Upstash Redis database and set `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN` in Vercel Production. Public mutations fail closed
  without distributed rate limiting in production.
- Never use `db push` against shared or production databases.
- Rotate all test credentials before the first production launch and verify webhook signing secrets independently per environment.

## Rollback

Application code may be rolled back in Vercel. Database changes are forward-fixed: do not run destructive schema rollback commands during an incident. Restore only through the backup runbook after evaluating financial and order-data impact.
