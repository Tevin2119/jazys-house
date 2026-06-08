# Coding Standards

Conventions and architectural rules for the Jazy's House Platform.

---

## Architecture Decisions

### Tenant-First Design
Every data model is tenant-scoped. The `Tenant` table is the root entity. All queries filter by `tenantId`. Middleware resolves tenant from hostname/path before any route handler runs.

### Server Components by Default
Next.js App Router encourages Server Components. Only add `"use client"` when you need:
- Event handlers (`onClick`, `onChange`)
- React hooks (`useState`, `useEffect`, `useContext`)
- Browser APIs (`localStorage`, `window`, `navigator`)
- Third-party client libraries (Zustand, Stripe.js)

### Thin API Routes
API routes handle external integrations (Stripe, email) and cross-cutting concerns. For simple form mutations, prefer Server Actions. API routes should be 20-50 lines, calling services in `@/lib/`.

---

## TypeScript Rules

### General
```typescript
// GOOD — explicit return types on exported functions
export async function getTenant(hostname: string): Promise<Tenant | null> {
  return prisma.tenant.findUnique({ where: { domain: hostname }});
}

// GOOD — use interfaces for object shapes, types for unions
interface ProductCardProps {
  product: ProductWithImages;
  variant?: 'grid' | 'list';
}
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// BAD — implicit any, untyped functions
function processOrder(data) { ... }
```

### Error Handling
```typescript
// GOOD — explicit error handling
try {
  const session = await stripe.checkout.sessions.create(params);
  return { success: true, url: session.url };
} catch (error) {
  console.error('Stripe session creation failed:', error);
  return { success: false, error: 'Payment setup failed. Please try again.' };
}

// BAD — silently swallowing errors
const session = await stripe.checkout.sessions.create(params).catch(() => null);
```

### Async Patterns
```typescript
// GOOD — parallel independent queries
const [products, categories] = await Promise.all([
  prisma.product.findMany({ where: { tenantId } }),
  prisma.category.findMany({ where: { tenantId } }),
]);

// BAD — sequential independent queries
const products = await prisma.product.findMany({ where: { tenantId } });
const categories = await prisma.category.findMany({ where: { tenantId } });
```

---

## React / Next.js Rules

### Component Structure
- **Keep files under 300 lines** — extract sub-components into co-located files
- **One component per file** (except small, tightly-coupled sub-components)
- **Use named exports** for components, default exports for pages/routes
- Co-locate component-specific types and styles in the same directory

```typescript
// GOOD — clean component structure
// components/store/product-card.tsx
interface Props { product: ProductWithImages; }
export function ProductCard({ product }: Props) {
  return (...);
}
```

### Data Fetching
```typescript
// Server Component — data fetching at the component level
export default async function ProductsPage({ params }: { params: { domain: string } }) {
  const tenant = await getTenant(params.domain);
  if (!tenant) notFound();
  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id, deletedAt: null },
    include: { images: true, category: true },
  });
  return <ProductGrid products={products} tenant={tenant} />;
}
```

### Forms
- Use Server Actions for simple mutations (add to cart, contact form)
- Use API routes for complex flows (checkout, file uploads)
- Always validate on the server, even if you validate on the client
- Show loading states during form submission

---

## Prisma / Database Rules

### Query Patterns
```typescript
// GOOD — use include for relations
const order = await prisma.order.findUnique({
  where: { id: orderId },
  include: {
    items: { include: { product: true } },
    tenant: true,
  },
});

// GOOD — tenant-scoped queries
const products = await prisma.product.findMany({
  where: { tenantId: currentTenant.id, deletedAt: null },
  orderBy: { createdAt: 'desc' },
});

// GOOD — transactions for multi-table writes
const [order, _] = await prisma.$transaction([
  prisma.order.create({ data: orderData }),
  prisma.cartItem.deleteMany({ where: { sessionId } }),
]);
```

### Soft Deletes
```typescript
// Prefer soft deletes for user-facing data
await prisma.product.update({
  where: { id: productId },
  data: { deletedAt: new Date() },
});

// Filter soft-deleted records in queries
where: { tenantId, deletedAt: null }
```

### Prisma Client
- **Singleton pattern** — one `PrismaClient` instance (`lib/db.ts`)
- Never create `new PrismaClient()` in components or API routes
- Use `prisma.$transaction` for atomic multi-table operations

---

## Styling Rules

### Tailwind
- Use Tailwind utility classes exclusively
- No inline styles except for dynamic values (e.g., tenant theme colors via CSS variables)
- No `<style>` blocks in components
- Use `cn()` utility from `@/lib/utils` for conditional classes

```typescript
import { cn } from '@/lib/utils';
<button className={cn(
  'px-4 py-2 rounded-lg font-medium',
  variant === 'primary' && 'bg-primary text-white',
  variant === 'outline' && 'border border-primary text-primary',
  disabled && 'opacity-50 cursor-not-allowed',
)} />
```

### Tenant Theming
- Define CSS custom properties per tenant in `lib/theme.ts`
- Apply via `<style>` tag in root layout using tenant config
- Variables: `--tenant-primary`, `--tenant-secondary`, `--tenant-font`, `--tenant-radius`

---

## Testing Rules

### E2E (Playwright)
- Test critical flows: browse → add to cart → checkout, admin product CRUD, tenant switching
- Run against local dev server: `npx playwright test`
- Test with Stripe test mode using test cards
- P0: checkout flow, P1: admin CRUD, P2: tenant management, P3: edge cases

### Unit Tests (Vitest)
- Test `lib/` utilities: tenant resolution, Stripe helpers, auth config
- Run: `npx vitest run`
