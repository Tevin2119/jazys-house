# JH-005 — Claude Code: DC Framework Gap Analysis

You are Seat 1 (Workhorse Kang). The Jazy's House Platform has all 6 phases implemented. But the design spec is NOT the original static site — it's a DC framework interactive demo.

## DC FRAMEWORK FILES (the actual design spec)
- Primary: C:\Users\Tevin\Downloads\Jazys House App (1).html (1.6MB, interactive demo)
- Earlier: C:\Users\Tevin\Downloads\Jazys House App.html (1.6MB)

These are self-extracting HTML bundles. They contain a full React-like app with:
- Desktop storefront: Home (hero, featured products, categories, catering teaser, newsletter), Shop (filterable product grid with cart)
- Desktop admin: Dashboard stats, Products (searchable with stock badges), Orders (status-filterable), Catering (inquiry cards with reply), Customers (list), Settings (theme editor)
- Mobile storefront: hamburger menu, compact product cards, cart overlay
- Mobile admin: bottom tab bar (4 tabs: Dashboard, Products, Orders, Catering), stacked card layouts
- Design tokens: Marcellus (headings), Hanken Grotesk (body), terracotta #c0563d primary, cream #f6efe4 bg, fully rounded buttons, glass-morphism header
- 15 hardcoded products with images, stock badges, add-to-cart

## YOUR JOB

1. Extract the decoded template from the DC framework file (it's a JSON-escaped HTML string in the __bundler/template script tag — use Node.js to decode it)
2. Study every page, component, layout, and interaction pattern in the DC framework
3. Compare against the EXISTING Next.js implementation at src/
4. List EVERY gap — what the DC framework has that our Next.js app doesn't
5. Categorize gaps: MISSING (not implemented), DIVERGENT (different approach), PARTIAL (half-done)

## EXISTING IMPLEMENTATION
- src/app/(store)/ — Home, Shop, Product Detail, Cart, Catering, About, Checkout
- src/app/(admin)/ — Dashboard, Products, Orders, Categories, Tenants, Settings, Catering
- src/components/store/ — 15 components (product-card, cart-view, store-header, etc.)
- src/components/admin/ — 17 components (admin-shell, product-form, tenant-switcher, etc.)
- Build: clean, 0 errors

## OUTPUT
Write a detailed gap analysis to .doa/council/JH-005/claude-gap-analysis.md with:
- Table of every DC framework feature vs existing implementation status
- Priority ranking (HIGH: missing core feature, MEDIUM: different approach, LOW: cosmetic)
- Estimated effort for each gap
- DO NOT write code — this is analysis only
