# Council of Kangs — Canonical Spec (Mirrored from ClubRight v5)

> **Source:** ClubRight Council of Kangs v5 — adapted for Jazy's House Platform
> **Ratified:** 2026-06-07

---

## FRONT FOUR (Primary Seats)

### Seat 0 — PRIME KANG: Hermes
- **Model:** deepseek-v4-pro (DeepSeek)
- **Role:** Chair. Orchestrate, coordinate, commit. Never builds.
- **Cost:** Free tier
- **Profile:** portable

### Seat 1 — WORKHORSE KANG: Claude Code
- **CLI:** claude v2.1.158
- **Model:** Sonnet (Max subscription)
- **Pool:** 5x usage limits
- **Role:** Plans + Builds. --dangerously-skip-permissions implements. Never validates own output.
- **Invocation:** `cat prompt.txt | claude --dangerously-skip-permissions -p "$(cat)"`
- **Budget:** 35 min investigation, 45 min implementation

### Seat 2 — SWARM KANG: OpenCode
- **CLI:** opencode v1.16.0
- **Model:** gpt-5.5
- **Pool:** $20/mo ChatGPT Plus (rivalkidchelsea)
- **Role:** Validates + Reviews. 5 subagents/review (bumped from 3). Reviews plans BEFORE execution.
- **Limit:** 20 messages/3 hours — batch ALL validations into one session

### Seat 3 — THINKER KANG: Codex CLI
- **CLI:** codex v0.137.0
- **Model:** gpt-5.5
- **Pool:** $20/mo ChatGPT Plus (tevin.clubright)
- **Role:** Conceptual analysis. Back-validates after Claude executes. Never builds.
- **Limit:** 20 messages/3 hours — pre-compute edge cases once, cache

---

## SPECIALIZED SEATS (The Three Variants)

### Seat 4 — THE MAKER (Reed-1610)
- **CLI:** pi v0.79.6
- **Model:** gpt-5.4-mini (openai-codex)
- **Cost:** $0.00 per invocation (sub included)
- **Role:** Radical synthesizer. Multi-perspective from Developer + Store Owner + Customer views.
- **Invocation:** `pi -p "synthesize: [problem]"`
- **Signature:** "Project Oversight concurs. The Children have spoken."

### Seat 5 — THE ADVERSARY (Lex Luthor, Earth-38)
- **CLI:** agy (antigravity)
- **Model:** gemini-2.5-pro (primary), gemini-2.5-flash (fallback)
- **Pool:** rivalkidchelsea@gmail.com — Google Pro $189/yr, unlimited, 5x limits
- **Cost:** $0.00 per invocation (Pro sub)
- **Role:** Kryptonite scans, exploit hunting, Anti-Monitor checks.
- **Invocation:** `agy --print --print-timeout 300s --dangerously-skip-permissions -p "adversarial audit: [problem]"`
- **Signature:** "I found your kryptonite. Fix it before someone else does."
- **Pitfall:** agy --print can return empty response on large outputs — use --print-timeout generously. agy respects .gitignore — can't read .doa/ directly.

### Seat 6 — THE ARCHIVIST (Doom 2099, Earth-928)
- **CLI:** pi v0.79.6 (**independent** — runs on its own, NOT a subagent)
- **Model:** gpt-5.4-mini (openai-codex)
- **Cost:** $0.00 per invocation (sub included)
- **Role:** Cross-session pattern tracking, institutional memory, anti-pattern documentation.
- **Invocation:** `pi -p "pattern check: [problem]"`
- **Signature:** "Doom has archived this. It will not be forgotten."
- **Pitfall:** Pi loads archivist extension — uses archivist skills/tools. Runs independently.

---

## PERSONA JURORS (Adapted for Jazy's House)

| ClubRight Persona | Jazy's House Persona | Role | Key Concern |
|-------------------|---------------------|------|-------------|
| **Louise** (Owner/Admin) | **Dienaba** (Store Owner) | Full access — products, orders, catering, settings | Fast product upload, clear order pipeline, payment anxiety |
| **Richard** (Staff) | — (Owner wears staff hat) | Staff-limited — till, check-in | Dienaba also does front-desk work |
| **Jane** (Member) | **Aminata** (Customer) | Mobile storefront — browse, cart, checkout | Beautiful images, fast checkout, trust |
| **Anonymous** (Public) | **Visitor** (Anonymous) | Landing page, signup, redirects | Clear navigation, compelling hero, social proof |

Every Council seat must evaluate against all four persona jurors.

---

## COUNCIL PROTOCOL v5 (12 Steps)

```
 0. PREFLIGHT       → Versions + dashboard
 1. HERMES DATA     → Context scrape → 01-task-data.md
 2. CLAUDE INVEST   → 35 min investigation → 02-claude-investigation.md
 3. CODEX THINK     → Gaps, prioritization → 03-codex-think.md
 4. CLAUDE PLAN     → Interactive /plan → 04-claude-plan.md
    PLAN GATE       → Hermes + Codex (+ OpenCode for risky) approve
 5. CLAUDE IMPLEMENT → 45 min build → 05-claude-implementation.md
 6. OPENCODE VALIDATE → Swarm review → 06-opencode-validation.md
 7. CODEX BACKVALIDATE → Thinker second pass → 07-codex-backvalidate.md
 8. MAKER           → 4-perspective synthesis → 08-maker-synthesis.md
 9. ADVERSARY       → Kryptonite scan → 09-adversary-audit.md
10. ARCHIVIST       → Pattern check → 10-archivist-patterns.md
11. EVIDENCE        → Screenshots, persona concurrence
12. COUNCIL MINUTES → Formal minutes with signatures
```

---

## COST PER FULL COUNCIL RUN

| Seat | Sessions | Cost |
|------|----------|------|
| Prime (Hermes) | 1 | $0 |
| Workhorse (Claude) | 1-2 | Max pool (watch 5x) |
| Swarm (OpenCode) | 1 | Plus pool (1/20) |
| Thinker (Codex) | 0-1 | Plus pool (cached) |
| Maker (Reed) | 1 | $0 |
| Adversary (Lex) | 1 | $0 (Pro sub) |
| Archivist (Doom) | 1 | $0 (sub included) |
| **TOTAL** | ~7 | $0 + Claude pool |

---

## KEY PITFALLS (Learned from Live Fires)

1. **No artifact = no seat.** Always pipe from prompt files, never ad-hoc -p.
2. **Hermes NEVER writes code.** The #1 failure mode: Hermes patch()-ing files instead of delegating to Claude.
3. **Claude -p hangs on 20+ files.** Split into smaller prompts. Kill after 4 min of zero output.
4. **Codex gets lost in node_modules/.** Add file-pattern guidance: "Focus on src/, skip node_modules/."
5. **OpenCode broken claim was stale.** Always verify with opencode --version before declaring unavailable.
6. **Screenshots are the golden parachute.** Evidence before commit, always. Even if it means taskkill.
7. **agy --print can return empty on large context.** Use --print-timeout 300s minimum for Adversary scans.
8. **Doom is INDEPENDENT.** Runs on its own Pi CLI with archivist extension. Not a subagent.
