# JH-005 OpenCode Validation

Validator: OpenCode / Swarm Kang  
Date: 2026-06-19  
Result: PASS with one aggregate caveat

## Checks

1. Fonts: PASS
   - `src/app/layout.tsx` imports `Marcellus` and `Hanken_Grotesk` from `next/font/google`.
   - `Marcellus` is configured at weight `400` with CSS variable `--font-heading`.
   - `Hanken_Grotesk` is configured at weights `400`, `500`, `600`, `700`, `800` with CSS variable `--font-body`.
   - `src/app/globals.css` uses the updated font stacks through `.font-heading` and `--tenant-font`.

2. Buttons: PASS
   - `src/components/ui/button.tsx` base button class includes `rounded-full`.
   - `sm` and `lg` size variants explicitly keep `rounded-full`.
   - Store CTA links checked in the touched pages are pill-shaped where intended.
   - Minor note: `shop/page.tsx` search button remains `rounded-md`, but it is a search form submit button rather than a CTA variant.

3. Announcement bar: PASS
   - Present in `src/app/(store)/layout.tsx` above `StoreHeader`.
   - Copy matches the DC spec text: `African Fashion & Healthy Good Food · Worldwide Delivery · Custom Made-To-Order`.
   - Styling matches the requested direction: dark `#2a1f16` background, cream text, uppercase, `11px`, `1.6px` tracking, centered.

4. Made-To-Order CTA: PASS
   - Present after the product grid in `src/app/(store)/shop/page.tsx`.
   - Link is `mailto:faye.dienaba@yahoo.com?subject=Custom%20Order%20Request`.
   - Card uses dashed gold border and dark rounded pill CTA.

5. Customers page: PASS with caveat
   - `/admin/customers` exists at `src/app/(admin)/admin/customers/page.tsx` and appears in the production route summary.
   - Sidebar nav item exists in `src/components/admin/sidebar-nav.tsx` after Catering with href `/admin/customers` and label `Customers 👥`.
   - Query is tenant-scoped and aggregates count/sum from orders:
     - `where: { tenantId, email: { not: null } }`
     - `_count: { id: true }`
     - `_sum: { total: true }`
     - `orderBy: { _sum: { total: "desc" } }`
   - `Order.total` is an `Int` minor-unit field, and `formatPrice(row._sum.total ?? 0, currency)` is compatible.
   - Caveat: the query groups by both `email` and `name`, so the same email with different names will appear as separate customer rows. If the intended customer identity is email-only, this should group by `email` only and derive a display name separately.

6. Build: PASS
   - Ran `npm run build`.
   - Build completed with 0 errors.
   - `/admin/customers` is included in the route output as a dynamic server-rendered route.
   - Non-blocking warning: Prisma reports `package.json#prisma` config is deprecated and should eventually move to `prisma.config.ts` for Prisma 7.

7. Unicode quote regression check: PASS
   - Grep for smart quote delimiters `[“”]` in `src/app/(store)/shop/page.tsx` returned no matches.
   - `npm run build` parses and compiles the shop route successfully.
   - Remaining non-ASCII content in the file is JSX text content such as emoji, ellipsis, apostrophe entities, and arrow text; no parse regression observed.

## Docs consulted

- `.doa/council/JH-005/claude-implementation.md`
- `CODING-STANDARDS.md`
- `STYLE-GUIDE.md`
- `prisma/schema.prisma`
