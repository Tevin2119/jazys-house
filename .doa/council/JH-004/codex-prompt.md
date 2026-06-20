# JH-004 — Codex Think Prompt

You are Seat 3 (Thinker Kang). Read .doa/council/JH-004/claude-investigation.md (Claude's findings). Then:

1. **Architectural gaps Claude missed** — what wasn't considered?
2. **Cost optimization** — is there a cheaper way than what Claude proposed?
3. **Scaling risks** — what breaks at 10 tenants? 100 tenants? 1000 products? 10,000 orders?
4. **Image storage ranking** — your own ranking, independent of Claude's. Justify each position.
5. **Database schism** — single DB multi-tenant vs separate DBs vs Postgres schemas. Which is right for THIS project (not a FAANG company)?
6. **Multi-tenant auth model** — NextAuth v5 with JWT. Can one user belong to multiple tenants? Edge cases?
7. **DC Framework analysis** — the framework has 15 hardcoded products, sc-if/sc-for templates, and a state class. What's the cleanest Next.js 15 migration path? Server Components can query Prisma directly — does the framework's template approach still make sense?

## RULES
- Focus on what Claude MISSED or got WRONG
- Be contrarian where justified — the Thinker's job is to find gaps
- Write to .doa/council/JH-004/codex-think.md
- Budget constraint: £0-5/mo total
