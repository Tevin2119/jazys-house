# Jazy's House Platform — AI Context

This file is the primary context for Claude Code. **Keep it concise** — every line costs context. Put detailed guidance in reference docs, link from here.

## Git Commit Guidelines
- Format: `#TASK TYPE: description`
- Keep first line concise (<72 chars)
- Use `*` bullet points for details

## Reference Docs
These are NOT loaded automatically. Read them when working on the relevant area:

- **[CODING-STANDARDS.md](CODING-STANDARDS.md)** — TypeScript/Next.js conventions, Prisma query rules, React patterns
- **[PERSONAS.md](PERSONAS.md)** — User personas (Dienaba — Store Owner, Aminata — Customer, Tevin — Platform Admin)
- **[STYLE-GUIDE.md](STYLE-GUIDE.md)** — Storefront + admin UI design language, Tailwind config, brand palette
- **[prisma/schema.prisma](prisma/schema.prisma)** — Database schema (tenant-first, all models)

## Key Rules
- **Tenant-first:** every DB query filters by `tenantId`. Middleware resolves tenant from hostname.
- **Server components by default.** Only add `"use client"` when you need interactivity.
- **Never use raw SQL** — Prisma for all DB access.
- **Stripe secrets never reach the client.** Checkout sessions are created server-side.
- **Follow [CODING-STANDARDS.md](CODING-STANDARDS.md)** for all code — especially async patterns, error handling, and component structure.
- **Before changing long-standing code, check with the user.** If `git blame` shows a line >6 months old and not part of the current task, flag before modifying.
- **Multi-tenant awareness:** admin operations must specify which tenant. Customer operations derive tenant from hostname.

## Code Style — TypeScript / React

### General
- Use `const` and `let`, never `var`
- Use `===` not `==`
- Prefer early returns over nested `if` blocks
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Use `async/await` over raw Promises
- Always handle errors — never silently swallow exceptions

### React / Next.js
- Server Components by default — data fetching in `async` components
- Client components: `"use client"` at top of file
- Use `useState` + `useEffect` for local state; Zustand for cross-component state (cart)
- Server Actions for form mutations (preferred over API routes for simple mutations)
- Use `next/image` for optimized images, never raw `<img>` (unless markdown/blog content)
- Use `next/link` for navigation, never raw `<a>` for internal links
- Route groups `(store)` / `(admin)` for layout separation

### Prisma
- Use `include` for eager-loaded relations
- Filter by `tenantId` on every multi-tenant query
- Use transactions (`prisma.$transaction`) for multi-table writes
- Prefer `findUnique` over `findFirst` when querying by unique field

### Tailwind / Styling
- Use Tailwind utility classes, not inline styles
- Use CSS variables for tenant theming (`var(--tenant-primary)`, etc.)
- shadcn/ui components imported from `@/components/ui/`
- Keep component files under 300 lines — extract sub-components

## PostgreSQL / Prisma Conventions
- Always use read-only mode for production DB access via MCP tools.
- Database: `jazyshouse` (dev), `jazyshouse_prod` (production).
- All IDs are CUIDs (not auto-increment integers).
- Tenant-scoped tables: `Product`, `Order`, `Category`, `Theme`, `Page`.
- Shared tables: `Tenant`, `User`, `AdminSession`.

## How to Use Claude Code on This Project

### Start with a plan
For anything beyond a trivial change, start in Plan mode. Iterate until solid, then execute.

### Council Workflow
When invoked as the Workhorse seat in the Council of Kangs:
- **Investigation:** Read `.doa/council/<TICKET>/brief.md`, trace code paths, report findings to `claude-investigation.md`
- **Planning:** Create implementation plan from investigation findings, write to `plan.md`
- **Implementation:** Build per approved plan. Run `npm run build` to verify. Write summary. Do NOT commit unless instructed.
- **Council artifacts live in `.doa/council/<TICKET>/`**

### Verify your work
- Build: `npm run build` to catch TS errors
- Type check: `npx tsc --noEmit`
- Lint: `npx next lint`
- Dev server: `npm run dev` (port 3000)

### Document what you learn
When you discover something non-obvious — a Stripe edge case, a Prisma quirk, a tenant resolution gotcha — write it down. Future sessions won't have your context.
