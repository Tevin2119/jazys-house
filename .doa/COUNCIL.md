# Council engine pointer

The council engine is NOT in this repo. Do not search for council-run.ps1 here.

- Entry point: `<this repo>\council.bat TICKET [TITLE] [TIER] [allow-implementation]` (repo-local wrapper, shared-engine since 2026-07-11)
- Also valid:  `%LOCALAPPDATA%\hermes\council.bat TICKET [TITLE] [TIER] "C:\Users\Tevin\source\repos\jazyshouse-platform" [allow-implementation]`
- Runtime:     `%LOCALAPPDATA%\hermes\scripts\council-run.ps1` (shared engine; the old v6.4 council-run-jazyshouse.ps1 is retired but kept for reference)
- Repo overrides: `%LOCALAPPDATA%\hermes\scripts\council-profile-jazyshouse.ps1` (Next.js/Prisma/Stripe mandates, tenant-isolation adversary, npm build gate; no Mongo/TaskBoard)
- Preflight:   `%LOCALAPPDATA%\hermes\scripts\council-preflight-jazyshouse.ps1`
- Artifacts:   `<this repo>\.doa\council\<TICKET>\` (written by seat CLIs only)

Intake: NO TaskBoard here - tickets are MANUAL (e.g. JH-002). Seed
`.doa\council\<TICKET>\brief.md` (>= 200 bytes: objective, current state, key questions,
constraints) BEFORE convening, or the wrapper/Seat 1 correctly blocks.

Convening = EXECUTING council.bat. Hand-writing seat artifacts is a faked council.
