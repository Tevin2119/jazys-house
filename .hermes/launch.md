# Jazy's House Platform — Launch Commands

**Environment default: LOCAL DEV (http://localhost:3000)**
**Design reference: `C:\Users\Tevin\jazyshouse\`**
**Full manual: `.doa/COUNCIL-REFERENCE.md`**

## Council of Kangs — Invocation Standards

| Kang | Agent | Invocation | Model | Account |
|------|-------|-----------|-------|---------|
| **Prime** | Hermes | `hermes -z "<task>" --yolo` | deepseek-v4-pro | DeepSeek |
| **Workhorse** | Claude Code | `echo "@orchestrator <task>" \| claude --dangerously-skip-permissions` | sonnet | tevin.clubright (Max) |
| **Swarm** | OpenCode | `opencode run "@orchestrator-agent <task>"` | gpt-5.5 | rivalkidchelsea ($20) |
| **Thinker** | Codex CLI | `codex exec "<task>"` | gpt-5.5 | tevin.clubright ($20) |

## Auxiliary

| Agent | Invocation | Model | Cost |
|-------|-----------|-------|------|
| **Scout** (Gemini) | `gemini -p "<task>" -m gemini-2.5-flash` | gemini-2.5-flash | Free |
| **Router** | via Hermes provider config | any | Per-token |
| **Eyes** (Browser-Harness) | CDP Chrome → `capture-evidence.py` | — | — |

---

## Claude Code — Workhorse Kang (Plan + Build)

### Standard invocation (PREFERRED — piped orchestrator)
```powershell
Set-Location "C:\Users\Tevin\source\repos\jazyshouse-platform"
echo "@orchestrator Review plan at .doa/plans/<plan-id>.md. Check completeness, edge cases, tenant scoping, payment security. Flag anything suspicious." | claude --dangerously-skip-permissions
```

### Implement (after plan approved)
```powershell
Set-Location "C:\Users\Tevin\source\repos\jazyshouse-platform"
echo "@orchestrator Implement plan at .doa/plans/<plan-id>.md. Follow AGENTS.md and CODING-STANDARDS.md. Write summary to .doa/implementations/<plan-id>.md" | claude --dangerously-skip-permissions
```

### Interactive
```powershell
Set-Location "C:\Users\Tevin\source\repos\jazyshouse-platform"
claude --dangerously-skip-permissions
```

### ⛔ NEVER use -p
`claude -p "..."` bypasses all 5 specialist orchestrator agents. Always pipe through `@orchestrator`.

---

## OpenCode — Swarm Kang (Validate + Test)

### Plan validation
```powershell
Set-Location "C:\Users\Tevin\source\repos\jazyshouse-platform"
opencode run "@validator Review plan at .doa/plans/<plan-id>.md for safety, regressions, tenant isolation, Stripe key exposure. Return PASS or FAIL." -m openai/gpt-5.5
```

### Code review
```powershell
Set-Location "C:\Users\Tevin\source\repos\jazyshouse-platform"
opencode run "@code-reviewer Review current git diff against CODING-STANDARDS.md. Check TypeScript, Prisma, React patterns, tenant scoping." -m openai/gpt-5.5
```

### Orchestrator (full suite)
```powershell
Set-Location "C:\Users\Tevin\source\repos\jazyshouse-platform"
opencode run "@orchestrator-agent Validate implementation from .doa/implementations/<plan-id>.md. Run all checks including E2E smoke." -m openai/gpt-5.5
```

---

## Codex CLI — Thinker Kang (Think + Back-validate)

### Conceptual analysis
```powershell
Set-Location "C:\Users\Tevin\source\repos\jazyshouse-platform"
codex exec "Read the plan at .doa/plans/<plan-id>.md. Think through the approach conceptually. Flag: architectural concerns, missing edge cases, tenant isolation gaps, Stripe security. Do NOT implement — analysis only."
```

### Back-validate (after implementation)
```powershell
Set-Location "C:\Users\Tevin\source\repos\jazyshouse-platform"
codex exec "Review the git diff for: type safety, Prisma query patterns (tenant-scoped?), React anti-patterns, Stripe key leaks. Return PASS or FAIL with evidence."
```

---

## Gemini CLI — Scout (Auxiliary)

### Rapid research
```powershell
Set-Location "C:\Users\Tevin\source\repos\jazyshouse-platform"
gemini -p "Research <topic>. Read AGENTS.md and DESIGN-REF. Report concisely." -m gemini-2.5-flash
```

### Security audit
```powershell
Set-Location "C:\Users\Tevin\source\repos\jazyshouse-platform"
gemini -p "Security audit of <area>. Check: Stripe key exposure, tenant isolation, auth bypass, input validation." -m gemini-2.5-flash
```

---

## Hermes — Prime Kang (Chair)

### Plan + commit
```bash
cd /c/Users/Tevin/source/repos/jazyshouse-platform
hermes -z "Draft implementation plan for <task>. Write to .doa/plans/<plan-id>.md" --yolo -m deepseek-v4-pro --provider deepseek
```

---

## Council Protocol (8 Steps)

```
1. THINK  → Codex reads plan context, thinks through approach
2. PLAN   → Claude /plan mode, investigates code, proposes fix
3. REVIEW  → OpenCode @validator + @code-reviewer validate plan
4. IMPLEMENT → Claude executes approved plan
5. BACK-VALIDATE → Codex reviews diff
6. LIVE-VALIDATE → Hermes loads page, captures screenshot
7. TEST    → OpenCode E2E smoke tests
8. COMMIT  → Hermes commits (human-approved)
```

## Model Access

| Agent | Account | Model | Cost |
|-------|---------|-------|------|
| Hermes | DeepSeek | deepseek-v4-pro | Per-token |
| Claude Code | tevin.clubright@gmail.com (Max) | sonnet/opus | $20/mo |
| OpenCode | rivalkidchelsea@gmail.com (Plus) | gpt-5.5 | $20/mo |
| Codex CLI | tevin.clubright@gmail.com (Plus) | gpt-5.5 | $20/mo |
| Gemini CLI | Google free | gemini-2.5-flash | $0 |
