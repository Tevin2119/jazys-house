# JH-004 — OpenCode Validate Prompt

You are Seat 2 (Swarm Kang). Validate the investigation:

Read .doa/council/JH-004/claude-investigation.md and .doa/council/JH-004/codex-think.md.

1. **Factual errors** — any wrong claims about pricing, limits, or APIs?
2. **Missing options** — any image storage / hosting / email provider not considered?
3. **Tenancy risks** — OpenCode should simulate: "If I'm tenant A and I craft a request with tenant B's product ID, does it return data?" Walk through the code paths.
4. **Stripe multi-tenant** — Stripe Connect vs shared account with metadata. Which is simpler for 2-10 tenants?
5. **Build/deploy pipeline** — Vercel + Prisma migrations. What's the CI/CD flow? How do migrations run in production?
6. **Monitoring** — free tier has no alerts. How do we know if the site is down? (UptimeRobot free? Vercel Analytics free tier?)
7. **Rate your agreement with Claude and Codex** on a scale of 1-5 for each recommendation. Flag any you strongly disagree with.

## RULES
- Write to .doa/council/JH-004/opencode-validate.md
- Be specific: cite exact lines from the investigation/think files
- Budget: £0-5/mo
