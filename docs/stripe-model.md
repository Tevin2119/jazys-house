# Stripe Model — Jazy's House Platform

**Decision:** Shared Stripe account with tenant metadata
**Ratified by:** Council JH-004 (OpenCode 5/5, Adversary 4/5, Archivist conditional)
**Date:** 2026-06-19

---

## Why Shared Account (Not Connect)

For 2-10 tenants at launch, a shared Stripe account with metadata tagging is the right call:

1. **Jazy's House is the merchant of record.** All funds land in one Stripe account. The platform handles payouts/accounting centrally.
2. **Tenants are internal brands** — not separate legal entities needing their own Stripe dashboards.
3. **Simplicity.** Stripe Connect adds onboarding flows, connected-account IDs per tenant, webhook account context, payout failure handling, and support burden.
4. **Budget.** Shared account = £0 additional cost. Connect requires platform account setup and per-transaction fees.

## Implementation

- One `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in environment
- Checkout Session `metadata: { orderId, tenantId }` for tenant attribution
- Webhook validates `metadata.tenantId` against order's tenant before mutation
- Admin order detail shows Stripe session link for payment visibility

## Migration Path to Connect

When a tenant needs their own Stripe account (separate payouts, disputes, tax reporting):

1. Add `stripeAccountId String?` to the `Tenant` model
2. Implement Stripe Connect onboarding (Express or Custom accounts)
3. Modify `lib/stripe.ts` to instantiate Stripe SDK per-tenant when `stripeAccountId` is present
4. Add `stripeAccount` header to webhook routing

**Do NOT implement Connect until it's a real requirement.** The current shared-account design is battle-tested and sufficient for the initial tenant base.
