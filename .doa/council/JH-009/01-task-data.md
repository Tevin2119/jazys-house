# JH-009: Full E2E System Test

The dev server is running at http://localhost:3000. Database has 3 tenants, 100 products, admin accounts.

## YOUR JOB: Systematic End-to-End Test
Test every page, every feature, every flow. Report ALL errors, 500s, broken links, missing data, auth issues.

## TEST PLAN

### 1. Auth Flow
- Visit /login — does page load? (200 or 500?)
- Login as admin@jazyshouse.com / admin1234 — redirects to /admin?
- Visit /admin — does it load? All sub-pages?
- Login as a customer — register new account at /login
- Does customer see nav-switcher with Wishlist/My Account?
- Logout — does it work?

### 2. Admin Pages (all must be 200)
- /admin (dashboard — stat cards, low stock widget, recent orders)
- /admin/products (search, stock status pills, count label)
- /admin/orders (filter pills, table)
- /admin/catering (card grid, reply buttons)
- /admin/customers (aggregated table)
- /admin/users (role badges, tenant memberships)
- /admin/settings (currency toggle, theme swatches)
- /admin/query-builder (select model, fields, filters, run, save)
- /admin/metrics (revenue, order breakdown, top products)

### 3. Storefront Pages (all must be 200)
- / (home — hero, featured, benefits, catering, lookbook, newsletter)
- /shop (category pills, product grid, MTO CTA)
- /shop/[any-slug] (product detail)
- /about
- /catering
- /cart

### 4. New User Features
- /account (requires login — name, email, order count)
- /orders (customer order history)
- /orders/[id] (order detail)
- /wishlist (saved items)

### 5. API Endpoints
- /api/auth/signin (POST — does auth work?)
- /api/health (if exists)
- /robots.txt
- /sitemap.xml

### 6. Console Errors
- Open each page and check browser console for JS errors, 404s, CSP violations

## OUTPUT
Write a comprehensive test report to .doa/council/JH-009/e2e-test-report.md with:
- Table of every URL tested, HTTP status, errors found
- Critical issues (500s, auth broken)
- Medium issues (missing features, UI glitches)
- Low issues (cosmetic)
- Specific file:line references for each bug found

Do NOT fix anything — this is discovery only.
