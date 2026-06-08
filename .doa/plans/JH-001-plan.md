# Jazy's House Platform — Implementation Plan

**Plan ID:** JH-001
**Drafted:** 2026-06-07
**Chair:** Prime Kang (Hermes)
**Status:** DRAFT — Awaiting Council Review

---

## 0. Context Summary

### Design Spec (Static Site)
- **Source:** `C:\Users\Tevin\jazyshouse\`
- **Size:** 2,027 lines (5 HTML pages + CSS + JS)
- **Products:** 59 items across 6 categories (women, men, kids, accessories, pantry, home)
- **Images:** 63 product/hero images
- **Catering:** 6 packages (Taste of Africa → Full Event Catering)
- **Pages:** Home, Shop, Catering, About, Cart (overlay), PWA manifest
- **Payment:** Stripe test key embedded, checkout is alert popup (not functional)

### Target
Transform the static HTML site into a fully functional, multi-tenant e-commerce platform:
- One admin dashboard → multiple customer-facing storefronts
- Real Stripe checkout (server-side sessions, webhooks)
- PostgreSQL-backed product/order management
- PWA: installable, offline-capable
- Deploy: Vercel free tier

---

## 1. Database Schema (Prisma + PostgreSQL)

### Phase 1 — Core Models

```prisma
model Tenant {
  id        String    @id @default(cuid())
  name      String
  slug      String    @unique
  domain    String?   @unique
  theme     Json?
  createdAt DateTime  @default(now())
  products  Product[]
  orders    Order[]
  categories Category[]
}

model Category {
  id        String    @id @default(cuid())
  tenantId  String
  tenant    Tenant    @relation(fields: [tenantId], references: [id])
  name      String
  slug      String
  products  Product[]
  @@unique([tenantId, slug])
}

model Product {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(fields: [tenantId], references: [id])
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id])
  name        String
  price       Float
  description String?
  images      String[]  // URLs (Vercel Blob or Cloudinary)
  badge       String?   // "BESTSELLER", "NEW", "SALE", "LIMITED"
  badgeClass  String?   // CSS class
  stock       Int       @default(999)
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  orderItems  OrderItem[]
}

model Order {
  id          String      @id @default(cuid())
  tenantId    String
  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  status      OrderStatus @default(PENDING)
  total       Float
  email       String?
  name        String?
  address     Json?       // Shipping address
  items       OrderItem[]
  stripeSessionId String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int
  price     Float   // Snapshot at time of order
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String?
  role      UserRole  @default(CUSTOMER)
  tenantId  String?   // null = super admin (all tenants)
  createdAt DateTime  @default(now())
}

enum UserRole {
  SUPER_ADMIN
  TENANT_ADMIN
  CUSTOMER
}

model CateringInquiry {
  id        String   @id @default(cuid())
  tenantId  String
  name      String
  email     String
  date      String
  guests    Int
  package   String?
  message   String
  status    String   @default("new") // new, contacted, booked, declined
  createdAt DateTime @default(now())
}
```

### Phase 1 Migration
- `npx prisma migrate dev --name init`
- Seed script: import 59 products from `js/main.js` into DB
- Seed first tenant: "Jazy's House Tokyo" (slug: jazyshouse, domain: jazyshouse.com)

---

## 2. Middleware — Tenant Resolution

```
Request → middleware.ts
  ├── Extract hostname from request
  ├── Resolve tenant: prisma.tenant.findUnique({ where: { domain: hostname } })
  ├── If no tenant → check path prefix (/jazyshouse → tenant lookup by slug)
  ├── If still no tenant → 404 or default landing
  ├── Inject tenant into request headers (x-tenant-id)
  └── Forward to route handler
```

Routes:
- Subdomain: `jazyshouse.localhost:3000` → tenant jazyshouse
- Path: `localhost:3000/jazyshouse` → tenant jazyshouse
- Custom domain: `jazyshouse.com` → CNAME → Vercel → tenant jazyshouse
- Admin: `localhost:3000/admin` → tenant switcher, no tenant context needed

---

## 3. Implementation Phases

### Phase 1: Foundation (Days 1-2)
- [x] Repo setup with Council infrastructure ✅ (DONE)
- [ ] `npx create-next-app@latest` in repo root
- [ ] Prisma schema + migration + seed script
- [ ] Middleware (tenant resolution)
- [ ] `lib/tenant.ts`, `lib/db.ts`, `lib/auth.ts`, `lib/stripe.ts`
- [ ] Tailwind + shadcn/ui configuration
- [ ] Layout shells: `(store)/layout.tsx`, `(admin)/layout.tsx`

### Phase 2: Admin Dashboard (Days 3-4)
- [ ] Admin login (NextAuth → SUPER_ADMIN / TENANT_ADMIN)
- [ ] Tenant switcher dropdown
- [ ] Product CRUD (create, edit, delete, image upload)
- [ ] Order management (list, view, status update)
- [ ] Catering inquiry management
- [ ] Tenant settings (theme colors, logo, domain)

### Phase 3: Storefront (Days 5-7)
- [ ] Home page — hero, featured products, categories, catering teaser
- [ ] Shop — product grid, category filtering, search
- [ ] Product detail page — images, description, add to cart
- [ ] Cart — Zustand state, add/remove/qty, persist to localStorage
- [ ] Catering page — packages, inquiry form (POST → DB)
- [ ] About page — brand story, values
- [ ] All pages match static site design pixel-for-pixel

### Phase 4: Checkout (Days 8-9)
- [ ] Stripe Checkout session creation (server-side)
- [ ] Webhook handler (payment_intent.succeeded → order.status = PROCESSING)
- [ ] Order confirmation page
- [ ] Test with Stripe test cards (4242 4242 4242 4242)

### Phase 5: PWA & Polish (Day 10)
- [ ] PWA manifest + service worker
- [ ] Offline product browsing
- [ ] Responsive: mobile-first, tablet, desktop
- [ ] SEO: meta tags, Open Graph, sitemap

### Phase 6: Deploy (Day 11)
- [ ] Vercel project setup
- [ ] Environment variables (DATABASE_URL, Stripe keys, AUTH_SECRET)
- [ ] Custom domain: jazyshouse.com
- [ ] Production smoke test

---

## 4. Council Review Gates

Each phase gates on council approval:

| Phase | Plan Review | Implementation | Validation | Sign-off |
|-------|------------|----------------|------------|----------|
| Phase 1 | Hermes + Codex | Claude | OpenCode + Codex | Council minutes |
| Phase 2 | Hermes + Codex | Claude | OpenCode + Codex | Council minutes |
| Phase 3 | Hermes + Codex | Claude | OpenCode + Codex | Council minutes |
| Phase 4 | Hermes + Codex + Lex (security) | Claude | OpenCode + Codex + Lex | Council minutes |
| Phase 5 | Hermes + Codex | Claude | OpenCode + Codex | Council minutes |
| Phase 6 | Hermes + Codex | Claude | OpenCode + Codex | Council minutes |

---

## 5. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Stripe key exposure in client code | 🔴 Critical | Codex + Lex audit at Phase 4 gate |
| Cross-tenant data leak | 🔴 Critical | Every query filters `tenantId`. OpenCode validates. |
| Design drift from static site | 🟡 Medium | Storefront reviewer (Claude agent) checks each PR |
| PostgreSQL connection issues | 🟡 Medium | Supabase free tier or local Docker for dev |
| Vercel cold starts | 🟢 Low | Acceptable for initial launch |
| Image storage costs | 🟢 Low | Vercel Blob free tier (10GB) sufficient |

---

## 6. Files in Scope

```
src/
├── app/
│   ├── (store)/[domain]/page.tsx
│   ├── (store)/[domain]/products/page.tsx
│   ├── (store)/[domain]/products/[slug]/page.tsx
│   ├── (store)/[domain]/cart/page.tsx
│   ├── (store)/[domain]/checkout/page.tsx
│   ├── (store)/[domain]/catering/page.tsx
│   ├── (store)/[domain]/about/page.tsx
│   ├── (store)/layout.tsx
│   ├── (admin)/dashboard/page.tsx
│   ├── (admin)/products/page.tsx
│   ├── (admin)/orders/page.tsx
│   ├── (admin)/tenants/page.tsx
│   ├── (admin)/layout.tsx
│   ├── api/products/route.ts
│   ├── api/checkout/route.ts
│   ├── api/webhooks/stripe/route.ts
│   ├── api/contact/route.ts
│   └── api/auth/[...nextauth]/route.ts
├── components/
│   ├── store/ (ProductCard, ProductGrid, CartPanel, CategoryFilter, Hero, Footer, Nav)
│   ├── admin/ (ProductForm, OrderTable, TenantSwitcher, DashboardStats)
│   └── ui/ (shadcn/ui primitives)
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── stripe.ts
│   ├── tenant.ts
│   └── utils.ts
├── hooks/
│   └── use-cart.ts
├── middleware.ts
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

---

## 7. Persona Concurrence Required

| Persona | Concern | Validation |
|---------|---------|------------|
| **Dienaba** (Owner) | Fast product upload, clear order pipeline, simple theme editor | Phase 2 + 3 |
| **Aminata** (Customer) | Beautiful mobile store, fast checkout, order tracking | Phase 3 + 4 |
| **Tevin** (Admin) | Multi-tenant isolation, easy deploys, rollback | Phase 1 + 6 |
| **Visitor** | Clear navigation, compelling hero, social proof | Phase 3 |

---

## 8. Success Metrics

- [ ] All 59 products importable from static site JS catalog
- [ ] Stripe checkout processes test payment end-to-end
- [ ] Two tenants can run side-by-side with isolated data
- [ ] Admin product CRUD works for both tenants
- [ ] PWA installable on mobile
- [ ] All static site pages replicated in Next.js, pixel-matched
- [ ] 0 Stripe keys in client bundles
- [ ] 0 cross-tenant data access

---

**Drafted by Prime Kang (Hermes). Submitted for Council Review.**

Next steps:
1. Seat 4 (MAKER/Reed) — multi-perspective synthesis
2. Seat 2 (SWARM/OpenCode) — validation
3. Seat 3 (THINKER/Codex) — conceptual analysis
4. Seat 5 (ADVERSARY/Lex) — security audit
5. Seat 6 (ARCHIVIST/Doom) — pattern check
6. Council minutes + sign-off
