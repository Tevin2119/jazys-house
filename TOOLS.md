# TOOLS.md — Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:
- Stripe test keys and webhook setup
- Database connection strings (references, not values)
- Vercel project config
- Local dev ports and URLs

## Current Setup

### Dev URLs
- Local: `http://localhost:3000`
- Tenant storefronts (local): `http://jazyshouse.localhost:3000`, `http://brand2.localhost:3000`
- Admin: `http://localhost:3000/admin`

### Vercel
- Project: `jazyshouse-platform`
- Domain: TBD

### Database
- Dev: PostgreSQL via Supabase (free tier) or local Docker
- Connection: `DATABASE_URL` in `.env.local`
- GUI: `npx prisma studio`

### Stripe
- Test mode for all development
- Webhook forwarding for local dev: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Design Reference
- Static site: `C:\Users\Tevin\jazyshouse\` — pixel-perfect reference for storefront
- Product catalog: `jazyshouse/js/main.js` — complete product list (60+ items)
- Images: `jazyshouse/images/` — all product images

---

Add whatever helps you do your job. This is your cheat sheet.
