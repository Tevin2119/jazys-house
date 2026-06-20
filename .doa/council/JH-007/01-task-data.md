# JH-007: Port DC Framework Admin & Storefront to Next.js

You are Seat 1 (Workhorse Kang). The DC framework at C:\Users\Tevin\Downloads\Jazys House App (1).html is a COMPLETE interactive app with storefront + admin, desktop + mobile. It IS the design. Port it directly onto the Next.js app.

## STEP 1: Extract and study the DC framework
The file is a self-extracting HTML bundle. The decoded template is in the __bundler/template script tag. Use Node.js to decode it:
```js
const fs = require('fs');
const content = fs.readFileSync('C:/Users/Tevin/Downloads/Jazys House App (1).html', 'utf8');
const match = content.match(/<script type="__bundler\/template">\n(.*?)\n  <\/script>/s);
const template = JSON.parse(match[1].trim().slice(1, -1));
fs.writeFileSync('/tmp/dc_template.html', template);
```
Study every section. The DC framework has:
- **Desktop storefront**: header (announcement bar, nav, cart pill button), home (hero with product image + overlay card, benefits strip, featured grid, catering full-bleed, lookbook, newsletter), shop (category pills, product grid, made-to-order CTA), cart drawer (slide-in panel), footer (payment currencies)
- **Desktop admin**: dark sidebar (#221913) with user profile at bottom, topbar, dashboard (greeting, stat cards, recent orders, low stock widget, catering widget, 2-col layout), products (searchable list with stock badges), orders (filter pills + table), catering (card grid with reply buttons), customers (aggregated from orders), settings (store name, theme swatches)
- **Mobile storefront**: hamburger menu (dark overlay), hero (product image + gradient + CTA), 2-col product grid, catering promo card, newsletter
- **Mobile admin**: bottom tab bar (Dashboard/Products/Orders/Catering), stacked card layouts
- **Design tokens**: Marcellus headings (400 weight), Hanken Grotesk body (400-800), #c0563d primary, #f6efe4 bg, #fffdf9 cards, #221913 dark, #c79a55 gold, 999px button radius, glass-morphism header

## STEP 2: Port admin pages to match DC framework exactly

Replace the EXISTING admin pages with DC framework layouts:

### Admin Layout (src/app/(admin)/layout.tsx + admin-shell.tsx)
- Dark sidebar: bg #221913, borders #3d2a1e, logo circular with gold border
- Nav items: Dashboard 📊, Products 🧺, Orders 📦, Catering 🍲, Customers 👥, Settings ⚙️
- Active: terracotta bg + white text. Inactive: #cbb9a3 muted gold, hover #3d2a1e
- User profile at bottom of sidebar: gold initial circle (#c79a55), name, role
- Topbar: store URL label, notification bell, avatar

### Dashboard (src/app/(admin)/admin/page.tsx)
- Greeting: "Good morning/afternoon/evening, [Name] 👋" + formatted date
- 4 stat cards: #fffdf9 bg, rounded-[13px], terracotta label, Marcellus 34px value, trend sub-line
- 2-col layout: 1.7fr orders table + 1fr (Low Stock widget + Catering summary)
- Low Stock widget: products where stock <= 8, colored pills
- Recent Orders: 6 rows with status badges (PENDING=amber, PROCESSING=blue, SHIPPED=purple, DELIVERED=green, CANCELLED=red)

### Products (src/app/(admin)/admin/products/page.tsx)
- Search input at top
- "X of Y products" count label
- Table/cards with: thumbnail, name, category, price, stock, badge, status (In stock/Low stock/Out of stock with colored pills)
- Edit/delete actions

### Orders (src/app/(admin)/admin/orders/page.tsx)
- Filter pills row (ALL, PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- Active pill: terracotta bg. Inactive: white bg with border
- Table with order ID, customer, status badge, items, total, date

### Catering (src/app/(admin)/admin/catering/page.tsx)
- Card grid: auto-fill minmax(320px,1fr)
- Each card: name (Marcellus), package (terracotta), guests+date, message excerpt, status badge, Reply button
- Status badges: NEW=amber, CONTACTED=blue, BOOKED=green, DECLINED=red

### Customers (src/app/(admin)/admin/customers/page.tsx)
- Aggregate from orders: groupBy email, count orders, sum total
- Table: Name, Email, Orders, Total Spent

### Settings (src/app/(admin)/admin/settings/page.tsx)
- Store name input
- Currency selector (pill toggle: GBP/JPY/USD/EUR)
- Theme color swatches (terracotta, green, blue, purple) — click to apply

## STEP 3: User Management System
Add a proper user management system:

### User Profiles (src/app/(admin)/admin/users/page.tsx)
- List all users with role, tenant membership, status
- Add/edit user: email, name, role, tenant assignment
- Change password (admin reset)
- TenantMembership management (assign user to multiple tenants)

### Customer Self-Service
- Profile page for logged-in customers: name, email, order history, saved addresses
- Password change

## STEP 4: Custom Query Builder for Admins
Create a generic data explorer for admins:

### Query Builder (src/app/(admin)/admin/query-builder/page.tsx)
- Select model (Product, Order, User, CateringInquiry, etc.)
- Select fields (checkboxes for each model field)
- Add filters (field, operator, value) — multi-filter support
- Sort (field + direction)
- Results displayed in a table
- Export as CSV
- Save queries (store in DB as JSON config per tenant)

### Saved Queries model (prisma/schema.prisma)
```
model SavedQuery {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name      String
  config    Json     // { model, fields, filters, sort }
  createdBy String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Metric Cards (src/app/(admin)/admin/metrics/page.tsx)
- Custom metric builder: name, query (select from saved queries), visualization (number, chart, table)
- Dashboard-able: metrics can be pinned to admin dashboard

## STEP 5: Wire to backend
- All data comes from Prisma queries
- Server Components fetch data, Client Components handle UI state
- Use tenantDb() from src/lib/tenant-db.ts for all tenant-scoped queries
- Preserve existing Server Actions for mutations

## RULES
- Read DC framework template fully before building
- Match DC framework colors, fonts, spacing, border-radius exactly
- Run npm run build after each major section
- Write summary to .doa/council/JH-007/claude-implementation.md
- This is a large task — work section by section, verify build after each
