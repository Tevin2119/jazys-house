# Monitoring and Alerting

## Required monitors

Configure monitors against the production root domain, with alerts sent to a role-based operations mailbox:

| Target | Purpose | Expected response |
| --- | --- | --- |
| `/` | storefront liveness | 200 |
| `/shop` | tenant/database-backed page | 200 and expected store name |
| `/login` | authentication surface | 200 |
| `/api/health` | database readiness | `{"status":"ok"}` and 200 |

`/api/health` performs a bounded `SELECT 1`. A 503 means the application cannot reach PostgreSQL.

## Payment monitoring

1. Configure Stripe webhook delivery alerts for `/api/webhooks/stripe`.
2. Alert on every webhook endpoint failure and investigate retries before they expire.
3. Review completed payments against `PROCESSING` orders daily during launch.
4. Monitor Vercel 5xx errors, function duration, and database connection errors.

## Error tracking

Install and configure an error-monitoring service before live payments. It must redact request bodies, authorization headers, Stripe payloads, carrier credentials, and customer addresses. Alerts need a named owner and an acknowledgement target.

## Alert drill

Test every alert destination after configuration and quarterly thereafter. Record the date, recipient, and result in the operations log.
