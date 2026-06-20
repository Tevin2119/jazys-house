All 5 fixes implemented and build passes clean. Here's what was done:

---

**FIX 6 — Dark Admin Sidebar**
- `admin-shell.tsx`: sidebar bg `#221913`, borders `#3d2a1e`, store name white, X button muted gold. Restructured to `flex flex-col` with a user profile block at the bottom (gold initial circle, name, role label).
- `sidebar-nav.tsx`: active = `bg-[#c0563d] text-white`, inactive = `text-[#cbb9a3] hover:bg-[#3d2a1e] hover:text-white`.

**FIX 7 — Dashboard Polish**
- Dynamic greeting (`Good morning/afternoon/evening, [Name] 👋`) + formatted date, computed server-side.
- `StatCard` redesigned: `#fffdf9` bg, `rounded-[13px]`, terracotta uppercase label, Marcellus 34px value, trend sub-line.
- Added `categoryCount` query; sub-lines: "in N categories" / "awaiting action" / "awaiting reply" / "delivered, all-time".
- **Low Stock widget**: queries `stock <= 8`, shows colored pills (red/orange/amber).
- Layout changed to `lg:grid-cols-[1.7fr_1fr]` — orders left, Low Stock + Catering stacked right.

**FIX 8 — Payment Currencies Row**
- Added `"Pay in ¥ JPY · £ GBP · $ USD · € EUR · CFA Franc (XOF)"` above copyright in the footer.

**FIX 9 — Newsletter Standalone Section**
- Removed newsletter block from `StoreFooter`.
- Added `pill?: boolean` to `NewsletterForm` (dark-bg pill styling when true).
- New standalone `<section style={{ background: "#2a1f16" }}>` after lookbook on the home page.

**FIX 10 — Order Filter Pills**
- Added `StatusPillFilter` to `filters.tsx` (horizontal scroll pill row, terracotta active state).
- Orders page now uses pills instead of the dropdown; `SelectFilter` preserved for other pages.
ies → "awaiting reply", Revenue → "delivered, all-time"
- Added `categoryCount` query to `Promise.all`
- Added **Low Stock widget**: `prisma.product.findMany({ where: { stock: { lte: 8 } } })`, colored pills (red = out of stock, orange ≤ 3, amber ≤ 8)
- Dashboard 2-col layout: `lg:grid-cols-[1.7fr_1fr]` (orders left, Low Stock + Catering stacked right)
- Removed unused Lucide + CardDescription imports

---

## FIX 8: Payment Currencies Row ✅

**Files changed:**
- `src/components/store/store-footer.tsx`

**Changes:**
- Added `"Pay in ¥ JPY · £ GBP · $ USD · € EUR · CFA Franc (XOF)"` above the copyright line in the footer bottom bar

---

## FIX 9: Newsletter as Standalone Section ✅

**Files changed:**
- `src/components/store/store-footer.tsx`
- `src/components/store/newsletter-form.tsx`
- `src/app/(store)/page.tsx`

**Changes:**
- Removed the embedded newsletter block from `StoreFooter`
- Removed unused `NewsletterForm` import from footer
- Added `pill?: boolean` prop to `NewsletterForm`: when true, uses `rounded-full` input with dark-bg styling (`bg-white/10 border-white/20 text-white`) and `rounded-full bg-[#c0563d]` button
- Added standalone `<section style={{ background: "#2a1f16" }}>` after LOOKBOOK in `(store)/page.tsx`: centered Marcellus heading, sub-copy, `<NewsletterForm cta="Join Now" pill />`

---

## FIX 10: Order Filter Pills ✅

**Files changed:**
- `src/components/admin/filters.tsx`
- `src/app/(admin)/admin/orders/page.tsx`

**Changes:**
- Added `cn` import to `filters.tsx`
- Added `StatusPillFilter` component: horizontal scrollable pill row; active = `bg-[#c0563d] text-white`; inactive = `bg-card text-muted-foreground` with terracotta hover; hidden scrollbar
- Orders page: replaced `<SelectFilter>` with `<StatusPillFilter>` (pills in a separate row below search)
- `SelectFilter` preserved for other admin pages

---

## Decisions & Notes

- `StatusPillFilter` is additive — `SelectFilter` is kept for products/categories pages
- Newsletter form's `pill` prop is opt-in; existing usages default to the original `rounded-md` style
- Low stock threshold is `<= 8` (matching DC spec)
- `font-heading` (Marcellus) is already loaded in `layout.tsx` as `--font-heading`
- `getGreeting()` and `dateStr` are computed server-side; `dynamic = "force-dynamic"` was already set

---

*Docs consulted: `.doa/council/JH-005/claude-gap-analysis.md` (sections A-1 to A-7, D-1 to D-5, F-1 to F-4, O-1, S-11)*
