All 5 fixes are complete and the build passes clean. Here's what was done:

---

**FIX 1 — Font Swap** (`layout.tsx`, `globals.css`)  
Replaced `Playfair_Display` + `DM_Sans` with `Marcellus` (weight 400 only) + `Hanken_Grotesk` (400–800). CSS variables and fallback stacks updated.

**FIX 2 — Button Pills** (`src/components/ui/button.tsx`)  
Changed base class from `rounded-md` → `rounded-full`. Also updated the `sm` and `lg` size variants. Every button and CTA in the app is now a pill shape.

**FIX 3 — Announcement Bar** (`src/app/(store)/layout.tsx`)  
Dark `#2a1f16` bar above the store header with cream text, 11px uppercase, 1.6px letter-spacing, and the three-part DC spec copy.

**FIX 4 — Made-To-Order CTA** (`src/app/(store)/shop/page.tsx`)  
Gold dashed-border card with ✂️ icon, Marcellus heading, and a dark pill mailto link appended after the product grid. Also fixed a pre-existing bug in this file: it had Unicode smart quotes (`U+201C`/`U+201D`) as JSX attribute delimiters which was causing the SWC parse error — replaced with ASCII quotes.

**FIX 5 — Customers Admin Page** (`src/app/(admin)/admin/customers/page.tsx` + `sidebar-nav.tsx`)  
New server page using `prisma.order.groupBy` to aggregate Name / Email / Order Count / Total Spent. "Customers 👥" nav item added to sidebar after Catering. No schema changes.
6px]` / `py-2.5` centered
- Copy: "African Fashion & Healthy Good Food · Worldwide Delivery · Custom Made-To-Order"

---

## FIX 4: Made-To-Order CTA

**File:** `src/app/(store)/shop/page.tsx`

Added a static section after the product grid:
- Dashed `border-[#d4a017]` gold border card on `bg-[#fffdf9]`
- Scissors emoji icon, Marcellus heading, description paragraph
- Dark pill CTA (`rounded-full`, bg `#2a1f16`) linked to `mailto:faye.dienaba@yahoo.com?subject=Custom%20Order%20Request`

**Side fix:** The original file contained Unicode smart/curly quotes (U+201C/201D) as JSX attribute delimiters, causing an SWC parse error. Replaced all instances with ASCII `"` via Python byte replacement. Remaining non-ASCII bytes (em dashes, emojis, right arrow) are valid JSX text content.

---

## FIX 5: Customers Admin Page

**File:** `src/app/(admin)/admin/customers/page.tsx` (new)

- `prisma.order.groupBy(["email", "name"])` scoped to `tenantId`, filtered `email: { not: null }`
- Computes `_count.id` (order count) and `_sum.total` (total spent in minor units)
- Ordered by `total desc` (highest spenders first)
- Renders shadcn `<Table>` with columns: Name / Email / Orders / Total Spent
- No schema changes required

**File:** `src/components/admin/sidebar-nav.tsx`

- Added `Users` Lucide icon
- Inserted `"Customers 👥"` nav item after Catering in the `NAV` array

---

## Build Result

```
Compiled successfully in 25.9s
Linting and type check: PASS
/admin/customers: 880 B, server-rendered on demand
All 30 routes: zero errors
```

*Docs consulted: `.doa/council/JH-005/claude-gap-analysis.md`, `prisma/schema.prisma` (Order model), `CLAUDE.md`*
