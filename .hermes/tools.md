# Jazy's House Platform — Available Tools

**Environment: LOCAL DEV (http://localhost:3000)**
**Design Reference: `C:\Users\Tevin\jazyshouse\`**

## Full Arsenal — Six Agents

| # | Agent | CLI | Version | Model | Best For |
|---|-------|-----|---------|-------|----------|
| 1 | **Hermes** | `hermes` | — | deepseek-v4-pro | Orchestration, commits, cross-repo |
| 2 | **Claude Code** | `claude` | v2.1.158 | sonnet | Implementation, deep investigation |
| 3 | **OpenCode** | `opencode` | v1.16.0 | gpt-5.5 | Plan validation, diff review |
| 4 | **Codex CLI** | `codex` | v0.137.0 | gpt-5.5 | MCP investigation, data tracing |
| 5 | **Gemini CLI** | `gemini` | v0.45.1 | gemini-2.5-flash | Rapid research, security audit |
| 6 | **OpenRouter** | via Hermes | — | any | Model diversity, fallback |

## Hermes Skills (to be created)

- `jazyshouse` — repo map, commands, conventions
- `jazyshouse-payments` — Stripe integration reference
- `jazyshouse-tenancy` — multi-tenant patterns, middleware
- `jazyshouse-e2e` — Playwright test authoring
- `jazyshouse-explorer` — codebase exploration

## Hermes Built-in Tools

- terminal — shell access in repo cwd
- search_files — ripgrep code search
- read_file / write_file / patch — file operations
- web_search / web_extract — documentation lookup
- browser — UI testing against localhost
- delegate_task — spawn isolated subagents
- memory — persistent cross-session memory
- session_search — recall past sessions

## Worker-Specific Tools

### Claude Code (Seat 2 — Workhorse)
- Full Claude Code toolset + Git + file editing + terminal
- 5 specialist agents: orchestrator, tenancy-guardian, payments-guardian, storefront-reviewer, db-investigator
- MCPs: MCP_DOCKER, hermes, context7

### OpenCode (Seat 3 — Validator)
- Full OpenCode toolset
- 3 specialist agents: orchestrator-agent, validator, code-reviewer
- Read-only by default for validation
- MCPs: MCP_DOCKER, hermes, context7

### Codex CLI (Seat 4 — Investigator)
- Full Codex toolset + MCP-heavy
- MCPs (to configure in `~/.codex/config.toml`):
  - `postgres_dev` — PostgreSQL dev (read)
  - `stripe_test` — Stripe test mode inspection
  - `MCP_DOCKER` — Docker orchestration
- Best for: DB traces, payment flow investigation, data validation

### Gemini CLI (Seat 5 — Scout)
- Full Gemini toolset
- Skills (to install to `~/.gemini/skills/`):
  - `jazyshouse-security` — Stripe + auth + tenant isolation audit
  - `jazyshouse-archivist` — Council record-keeping, plan indexing
- MCPs: MCP_DOCKER (configured in `~/.gemini/settings.json`)

## External MCPs (available to all workers)

- MCP_DOCKER — Docker orchestration
- hermes — Hermes tools (terminal, web, browser, delegate)
- postgres_dev — PostgreSQL dev (read/write local)
- postgres_prod — PostgreSQL prod (read-only)
- stripe_test — Stripe test mode MCP
- context7 — API docs (Next.js, Prisma, Stripe, Tailwind, shadcn/ui)
- playwright — E2E browser automation
