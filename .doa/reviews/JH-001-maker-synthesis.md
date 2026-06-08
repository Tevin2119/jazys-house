# JH-001 MAKER SYNTHESIS — Multi-Perspective Review

**Seat 4 — THE MAKER (Reed-1610)**
**Synthesized:** 2026-06-07
**Sources:** Thinker (Seat 3), Adversary (Seat 5), Archivist (Seat 6)
**Disposition:** ⚠️ PLAN REVISION REQUIRED — 7 Critical items before Phase 1

---

## Cross-Seat Consensus

The three specialized seats independently reviewed JH-001. Their findings converge on seven critical items:

| # | Finding | Thinker | Adversary | Archivist | Consensus |
|---|---------|---------|-----------|-----------|-----------|
| 1 | Middleware DB query won't work in Edge | 🔴 Critical | 🟠 High | — | **UNANIMOUS — must fix** |
| 2 | Stripe test key in static site git history | 🔴 Critical | 🔴 Critical | — | **UNANIMOUS — must rotate** |
| 3 | Webhook signature verification missing | 🔴 Critical | 🔴 Critical | — | **UNANIMOUS — must add** |
| 4 | No server-side price verification | 🟠 High | 🔴 Critical | — | **CRITICAL — combines to critical** |
| 5 | `price: Float` is anti-pattern | — | — | 🟠 Gate | **HIGH — must use Decimal/Int** |
| 6 | Cart localStorage-only (no server persist) | 🟡 Medium | — | 🟠 Gate | **HIGH — Aminata multi-device fail** |
| 7 | Admin routes have no auth guard | — | 🔴 Critical | — | **CRITICAL — must add** |

---

## Seat-by-Seat Summary

### Seat 3 — THINKER (Codex): 20 issues
- **Verdict:** REVISE before Phase 1
- 7 🔴 Critical, 6 🟠 High, 7 🟡 Medium
- Top hit: Prisma in Edge Middleware impossible without Accelerate
- Second hit: `CateringInquiry` missing `tenant` relation declaration
- Third hit: No Prisma-level tenant auto-filtering (defense-in-depth)

### Seat 5 — ADVERSARY (Lex): 20 vulnerabilities
- **Verdict:** NOT YET SAFE
- 6 🔴 Critical, 9 🟠 High, 5 🟡 Medium
- Top hit: Header-based tenant spoofing (inject x-tenant-id)
- Second hit: Admin routes with zero auth guard
- Third hit: Checkout reads price from client cart (price tampering)

### Seat 6 — ARCHIVIST (Doom): 7 warnings
- **Verdict:** CONDITIONAL APPROVAL
- 4 Gate-level (must fix), 3 Advisory
- Top hit: `price: Float` anti-pattern
- Second hit: Cart localStorage-only fails Aminata multi-device
- Third hit: Council protocol deviations (Maker missing from gates, OpenCode missing from Phase 4)

---

## Persona Impact Assessment

| Finding | Dienaba (Owner) | Aminata (Customer) | Tevin (Admin) | Visitor |
|---------|-----------------|-------------------|---------------|---------|
| Edge Middleware bug | — | Store won't load on custom domain | Deploy fails on Vercel | 404 |
| Stripe key in repo | Payment anxiety if key compromised | Card data risk | Security incident | — |
| No webhook sig verify | Orders stuck in PENDING | Never gets confirmation email | Debugging nightmare | — |
| Price tampering | Revenue loss | — | Financial liability | — |
| Float price | Inaccurate totals | — | Rounding bugs | — |
| localStorage cart | — | Cart lost across devices | Support tickets | Lost sales |
| No admin auth | Unauthorized access to her store | — | Platform compromise | — |

---

## Recommendation: Revise Plan, Then Proceed

The plan is architecturally sound but has implementation gaps that three independent reviews confirmed. The revision should address:

1. **Replace Edge middleware** with layout-based resolution or Prisma Accelerate
2. **Rotate Stripe test key** from static site git history
3. **Add webhook verification** (`stripe.webhooks.constructEvent`) to plan
4. **Add server-side price verification** at checkout
5. **Change `price: Float` to `price: Int`** (cents) in schema
6. **Add server-side cart** or session-based cart persistence
7. **Add admin auth guard** (middleware or layout-level check)
8. **Add Council gate corrections**: Maker on all gates, OpenCode on Phase 4
9. **Fix `CateringInquiry` schema bug** (missing tenant relation)
10. **Add rate limiting** for checkout/contact endpoints
11. **Add email integration** to Phase 4+ plan

**Project Oversight concurs. The Children have spoken.**

Signed,
THE MAKER (Reed-1610)
