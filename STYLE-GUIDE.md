# STYLE-GUIDE.md — Jazy's House Design System

> Extracted from the DC framework demo (`Jazys House App (1).html`) and original static site.

---

## Brand Identity

- **Brand:** Jazy's House Tokyo — African Fashion & Healthy Good Food
- **Tagline:** "From our hands to your heart"
- **Vibe:** Warm, handcrafted, authentic, bold. Not luxury — soulful.
- **Est:** 2025

---

## Color Palette

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Primary (terracotta) | `#c0563d` | red-700-ish | CTAs, buttons, active nav, links, accent text |
| Primary hover | `#a3442e` | — | Button hover states |
| Gold accent | `#c79a55` | amber-500-ish | Logo border, admin avatar, subtle accents |
| Dark | `#2a1f16` | — | Primary text, header bg, badges |
| Dark bg | `#221913` | — | Admin header, switcher bar |
| Cream bg | `#f6efe4` | — | Page background |
| Card bg | `#fffdf9` | — | Cards, panels |
| Light section | `#efe4d2` | — | Alternate section bg (feature bar) |
| Border | `#e6dccb` | — | Card borders, inputs |
| Border light | `#ece2d2` | — | Subtle borders |
| Muted text | `#6b5d4f` | — | Secondary text |
| Lighter text | `#8a7c6a` | — | Placeholder, tertiary |
| Success green | `#6b8a5c` | — | Revenue subtext |
| Status green bg | `#d8ecd9` | — | In stock, delivered badges |
| Status green text | `#2f6b3a` | — | |
| Status amber bg | `#fbe5cf` | — | Pending, low stock |
| Status amber text | `#9a6b1e` | — | |
| Status red bg | `#f3dad4` | — | Out of stock, cancelled |
| Status red text | `#a3442e` | — | |
| Status blue bg | `#d8e6f5` | — | Processing, shipped |
| Status blue text | `#2f5d8a` | — | |

---

## Typography

| Token | Font | Weight | Usage |
|-------|------|--------|-------|
| **Display / Headings** | `'Marcellus', serif` | 400 | Page titles (40-62px), section heads, product names, menu |
| **Body** | `'Hanken Grotesk', system-ui, sans-serif` | 400-800 | All body text, nav, buttons, labels |
| Button weight | Hanken Grotesk | 700 | All CTAs and buttons |
| Label uppercase | Hanken Grotesk | 600-700 | Category labels, badges, announcement bar |
| Small labels | Hanken Grotesk | 700 | Pill labels, status badges |

Font sizes (desktop):
- Hero heading: 62px Marcellus
- Section heading: 40-44px Marcellus
- Product name: 18px Marcellus
- Body: 14-17px Hanken Grotesk
- Small/captions: 10-13px Hanken Grotesk

---

## Spacing & Layout

- **Max content width:** 1240px centered
- **Page padding:** 28px horizontal on desktop, 16px on mobile
- **Section padding:** 44-74px vertical
- **Card gaps:** 22-24px grid gaps
- **Card padding:** 16px internal

---

## Border Radius

| Element | Radius |
|---------|--------|
| Buttons, pills, badges | `999px` (fully rounded) |
| Cards | `10-12px` |
| Inputs | `9-10px` |
| Mobile tabs | `8px` |
| Logo | `50%` (circle) |

---

## Shadows

| Usage | Value |
|-------|-------|
| Product cards | `0 1px 3px rgba(0,0,0,0.04)` |
| Hero overlay badge | `0 18px 44px rgba(42,31,22,0.20)` |
| Switcher bar | `0 12px 34px rgba(0,0,0,0.32)` |

---

## Components — Design Patterns

### Header / Nav
- Sticky, glass-morphism: `rgba(246,239,228,0.92)` + `backdrop-filter: blur(10px)`
- Border bottom: `1px solid #e6dccb`
- Logo: 46px circle image + brand name in Marcellus + tagline in uppercase 8.5px
- Nav links: 14.5px Hanken Grotesk 600 weight, 28px gap
- Cart button: terracotta pill with 🛒 icon + count

### Product Card
- White card (`#fffdf9`) with 12px border radius, 1px border
- Image: 300px height, object-fit cover (desktop) / 150px (mobile)
- Badge: dark pill `#2a1f16` top-left corner
- Content: category label (10.5px uppercase rust), product name (18px Marcellus), price + Add button
- Mobile: compact with + button (30px circle)

### Buttons
- Primary: `bg-[#c0563d] text-white rounded-full px-6 py-3.5 font-bold`
- Outline: `bg-transparent border-1.5 border-[#2a1f16] rounded-full`
- Text link: `text-[#c0563d] font-bold cursor-pointer`

### Category Pills
- Horizontal scroll on mobile, wrap on desktop
- Active: terracotta bg + white text + terracotta border
- Inactive: white bg + dark text + cream border

### Cart
- Slide-in panel from right (desktop) / full-page (mobile)
- Items: image thumb + name + qty + line total + ✕ remove
- Empty state: centered 🛍️ icon + "Your cart is empty."

### Footer
- Multi-column on desktop, stacked on mobile
- Background: dark (`#2a1f16`)
- Newsletter section
- Currency line: ¥ JPY · £ GBP · $ USD · € EUR · CFA Franc

### Admin Layout
- **Desktop:** Dark sidebar (left, 240px) with nav items
- **Mobile:** Bottom tab bar (4 tabs: Dashboard, Products, Orders, Catering)
- Admin header: dark bg with page title + avatar circle
- Stats: 2x2 grid mobile, 4-across desktop
- Tables: stacked cards on mobile with status badges

---

## Mobile Patterns

- Bottom tab bar: `position:absolute; bottom:0` with 4 icon+label items
- Hamburger menu: dark overlay (`#2a1f16`) with large Marcellus links
- Product grid: 2-col, compact cards
- Cart: full-page overlay
- Category filter: horizontal scroll above products
- Announcement bar: sticky top, hideable

---

## Image Handling

- Product images: 300px height desktop, 150px mobile
- Hero image: 560px height, full-width
- Placeholder pattern: repeating diagonal stripes in brand color
- Placeholder label: monospace uppercase in white
- All images use `object-fit: cover`, `border-radius: 10-12px`

---

## Tenant Theming (CSS Custom Properties)

Per-tenant overridable:
```css
--tenant-primary: #c0563d;
--tenant-accent: #c79a55;
--tenant-bg: #f6efe4;
--tenant-card: #fffdf9;
--tenant-text: #2a1f16;
--tenant-font-heading: 'Marcellus', serif;
--tenant-font-body: 'Hanken Grotesk', sans-serif;
--tenant-radius: 10px;
```
