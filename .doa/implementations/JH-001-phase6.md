# JH-001 Phase 6 — Deploy (Vercel + PWA Polish)

**Status:** ✅ Implemented · `npm run build` green · `npx tsc --noEmit` clean · `npx prisma validate` ✓
**Date:** 2026-06-07
**Phase:** 6 of 6 (Deploy / PWA polish — final phase)

Production deployment readiness: Vercel config, security headers + CSP, a real
(rebuilt) service worker with offline fallback, robots/sitemap/favicon, env
documentation, and Supabase/Stripe setup guides. No application/business logic
changed — this phase is infrastructure, hardening, and docs only.

---

## Files changed

| File | Change |
|---|---|
| `vercel.json` | **New.** `framework: nextjs`, `buildCommand: prisma generate && next build`, `installCommand: npm install`, `outputDirectory: .next`, `regions: ["iad1"]`. |
| `next.config.ts` | Added `async headers()` applying CSP + `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` to `/:path*`. Kept existing `remotePatterns` + `outputFileTracingRoot`. |
| `public/sw.js` | **Rewritten.** The old SW precached static-site assets (`/index.html`, `/css/style.css`, `/js/main.js`, `/manifest.json`) that don't exist in this app — `cache.addAll()` would have rejected and failed install. New SW: cache-first for `/_next/static` + `/images`, network-first for navigations with an `/offline` fallback, and never caches `/api`, `/admin`, `/login`, `/checkout`. |
| `src/components/pwa-register.tsx` | **New.** Client component that registers `/sw.js` **in production only** (skips dev so SW caching never serves stale code while iterating). |
| `src/app/offline/page.tsx` | **New.** Static offline fallback served by the SW when a navigation fails. `robots: { index: false }`. |
| `src/app/robots.ts` | **New.** Per-host `robots.txt` (force-dynamic, mirrors the sitemap's host derivation). Allows `/`, disallows `/admin`, `/api`, `/login`, `/checkout`; points at `<host>/sitemap.xml`. |
| `src/app/manifest.ts` | Polished: added `id`, `scope`, `orientation`, `lang`, `categories`. Icons (192/512 + maskable) were already complete and present on disk. |
| `src/app/layout.tsx` | Added `metadataBase` (from `NEXT_PUBLIC_APP_URL`), title template, `icons` (favicon + PNG icons), `manifest`, `appleWebApp`, and mounted `<PwaRegister />`. |
| `public/favicon.ico` | **New.** Copied from `public/images/icon-192.png` so the favicon reference resolves. |
| `.env.example` | Augmented: production/deploy notes (Vercel), `AUTH_TRUST_HOST` guidance for custom-domain proxying, and optional `RESEND_API_KEY` / `CLOUDINARY_URL` / `BLOB_READ_WRITE_TOKEN` placeholders. Real var names kept (no phantom `AUTH_URL`). |
| `docs/supabase-setup.md` | **New.** Project creation, pooled vs. direct connection strings (and why both), migrate/seed, verify, troubleshooting. |
| `docs/stripe-setup.md` | **New.** Test keys, webhook endpoint + signing secret, Stripe CLI local testing, checkout-flow explanation, live-key switch. |
| `README.md` | Rewritten: overview, tech stack, quick start, admin access, architecture, scripts table, deployment (links to setup docs), PWA, and the Council of Kangs workflow. |

---

## Task checklist

- **6a — Vercel config:** ✅ `vercel.json` with framework, build/install commands, output dir, region `iad1`. Env vars are documented (in `.env.example` + README + docs) rather than declared in `vercel.json`, because Vercel `env` entries require `@secret` references — placeholders there would be invalid. Set them in the Vercel dashboard.
- **6b — Env documentation:** ✅ `.env.example` already covered every var the code reads; augmented with deploy notes + optional integrations. **Deviation from the task template:** the template's `AUTH_URL` is *not* used anywhere — the code uses `NEXT_PUBLIC_APP_URL` (Stripe redirects/absolute links) and Auth.js auto-detects the host on Vercel. Kept the real names instead of introducing a dead var.
- **6c — PWA hardening:** ✅ Manifest icons verified (all present). CSP added (see 6d). `robots.ts` added. Favicon added + referenced. **Offline support was non-functional** — the SW was stale *and never registered anywhere*; rebuilt it and added a production-only registrar + offline page, so the PWA is now real.
- **6d — next.config hardening:** ✅ `remotePatterns` already had Vercel Blob + Cloudinary. Added the full security-header set + CSP.
- **6e — Supabase guide:** ✅ `docs/supabase-setup.md`.
- **6f — Stripe guide:** ✅ `docs/stripe-setup.md`.
- **6g — README:** ✅ Rewritten with all requested sections.
- **6h — Final verification:** ✅ See below.

---

## Deviations / notes for the user

- **CSP uses `'unsafe-inline'` for `script-src` and `style-src`.** Next.js injects inline bootstrap/hydration scripts and next/font + Tailwind emit inline styles; without a nonce-emitting middleware a stricter policy would break hydration. The recommended upgrade is a nonce-based CSP set in `middleware.ts` — deferred so this phase doesn't reopen the (deliberately DB-free, edge) middleware. Everything else in the CSP is locked down (`frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, img/connect scoped).
- **Env vars are not declared in `vercel.json`** — see 6a. Document-only, set in the dashboard.
- **`favicon.ico` is a PNG renamed to `.ico`** (copied from `icon-192.png`). Modern browsers sniff and render it fine; swap in a true multi-resolution `.ico` if you want pixel-perfect small sizes.
- **Service worker now registers (production only).** This is a *new* runtime behavior. Caching is intentionally conservative — only immutable hashed assets and images are cached; HTML is always network-first and dynamic/sensitive routes are never cached — so it can't serve a stale price, cart, or admin view.
- **Doc-writer corrections worth knowing** (surfaced while writing the guides): checkout redirect URLs are built from the **request origin**, with `NEXT_PUBLIC_APP_URL` only as a *fallback*; `success_url` → `/checkout/confirmation?session_id=…`, `cancel_url` → `/cart`; order currency is **per-tenant** (`tenant.currency`), not hardcoded GBP. The Stripe guide documents the four webhook events the handler actually switches on.
- **Pre-existing warning (not introduced here):** `package.json#prisma` seed config is deprecated in favor of `prisma.config.ts` (Prisma 7). Non-blocking; migrate before the Prisma 7 upgrade.

---

## Verification

```
npx prisma validate   # ✓ schema valid
npx tsc --noEmit      # ✓ clean
npm run build         # ✓ green — 29 app routes incl. new /offline, /robots.txt, /manifest.webmanifest, /sitemap.xml; middleware 34.3 kB
```

**Secret scan:** `.env` is git-ignored and not tracked; every `sk_`/`pk_`/`whsec_`
occurrence in the tree is a placeholder (`xxxx…`) in `.env.example` or the docs.
No real secrets committed.

### Route inventory (29)

```
/                          /admin/products/[id]/edit   /checkout
/_not-found                /admin/products/new         /checkout/confirmation
/about                     /admin/select-tenant        /login
/admin                     /admin/settings             /manifest.webmanifest
/admin/categories          /admin/tenants              /offline
/admin/catering            /admin/tenants/[id]/edit    /robots.txt
/admin/orders              /admin/tenants/new          /shop
/admin/orders/[id]         /api/auth/[...nextauth]     /shop/[slug]
/admin/products            /api/webhooks/stripe        /sitemap.xml
                           /cart                       /catering
```

---

## Recommended follow-ups (not blocking deploy)

1. **Nonce-based CSP** — drop `'unsafe-inline'` once a nonce is wired through `middleware.ts` + `next/script`.
2. **True `.ico` favicon** — replace the PNG-as-ico with a real multi-res icon.
3. **Migrate Prisma seed config** to `prisma.config.ts` ahead of Prisma 7.
4. **`AUTH_TRUST_HOST=true`** in production if custom-domain tenants hit Auth.js host/callback mismatches behind Vercel's proxy.
```
