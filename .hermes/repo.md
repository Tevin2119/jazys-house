# Jazy's House Platform — Repo Context

Path: `C:\Users\Tevin\source\repos\jazyshouse-platform`
Type: Next.js 15 multi-tenant e-commerce platform
Stack: TypeScript + Prisma + PostgreSQL + Stripe + Tailwind + shadcn/ui

## Active

Hermes working directory defaults here for Jazy's House tasks.

## Quick Start (Local Dev)

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Fill in DATABASE_URL, Stripe keys, AUTH_SECRET

# Push database schema
npx prisma db push

# Start dev server
npm run dev
# → http://localhost:3000
# → Admin: http://localhost:3000/admin
# → Storefront (jazyshouse): http://jazyshouse.localhost:3000
```

## Design Reference

The static site at `C:\Users\Tevin\jazyshouse\` is the pixel-perfect spec:
- `index.html` — landing page layout
- `shop.html` — product grid and filtering
- `catering.html` — catering packages and inquiry form
- `about.html` — brand story and values
- `css/style.css` — design system (colors, typography, spacing)
- `js/main.js` — complete product catalog data (60+ products)

All storefront UI should match this design. Admin UI can diverge (use AdminHub pattern from `jazys-admin`).

## Environment URLs

| Environment | URL | Use |
|-------------|-----|-----|
| Local | `http://localhost:3000` | **DEFAULT for development** |
| Preview | Vercel preview URL | Pre-release verification |
| Production | TBD | Live site |

## Git State
Check `git status` before starting work. Current branch and pending changes matter.

## Safety Reminders
- Never commit `.env` files
- Stripe test mode only for development
- PostgreSQL: read-only for production, local write allowed for dev
- Multi-tenancy: every query must filter by `tenantId`
- Design fidelity: match the static site's look and feel exactly
