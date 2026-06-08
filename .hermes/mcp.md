# Jazy's House Platform — MCP Endpoints

MCP servers relevant to this project.

## Database

### postgres_dev (Development DB)
Command: TBD — PostgreSQL MCP server
DB Name: `jazyshouse_dev`
Usage: Query dev data for debugging, validation, test setup
Rules: READ-ONLY for production mirrors. Write allowed on local dev.

### postgres_prod (Production DB)
Command: TBD — PostgreSQL MCP server
DB Name: `jazyshouse_prod`
Usage: Investigate production issues, verify data patterns
Rules: READ-ONLY always. Never write, update, delete against production.

## Payments

### Stripe MCP
URL: `https://mcp.stripe.dev/mcp` (or local proxy)
Usage: Test Stripe integration, verify webhooks, inspect payment intents
Rules: Test mode only. Never connect to live Stripe keys via MCP.

## Documentation

### context7
URL: `https://mcp.context7.com/mcp`
Usage: Library/API docs for Next.js, Prisma, Stripe SDK, Tailwind, shadcn/ui
Always use: resolve-library-id → query-docs

## Infrastructure

### MCP_DOCKER
Command: `docker mcp gateway run --profile jazyshouse`
Usage: Docker container management, PostgreSQL container, service health checks

## Testing

### Playwright MCP
Command: TBD
Usage: Browser automation for E2E testing, visual regression
Rules: Run against local dev server, never production
