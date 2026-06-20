# JH-008: Login-Aware Navigation + User Features

Read the DC framework reference: C:\Users\Tevin\Downloads\Jazys House App (1).html
The DC framework has a floating bottom bar with Storefront/Shop/Admin/Desktop/Mobile buttons.

## FIX 1: Floating Nav Bar (login-aware)
Create src/components/store/nav-switcher.tsx (Client component):
- Fixed bottom bar, centered, dark bg #221913, rounded-full, shadow
- Same style as DC framework but WITHOUT Desktop/Mobile toggle
- Shows based on auth state:
  - **Logged out**: "Login" button → /login
  - **Customer**: "Storefront" | "Shop" | "My Account" (orders/history) | "Wishlist ♡"
  - **Admin**: "Storefront" | "Shop" | "Admin" (links to /admin) | "My Account"
- Mount in src/app/(store)/layout.tsx (storefront only, not admin)
- Use useSession() from next-auth/react to detect role

## FIX 2: Wishlist/Favourites
Add wishlist model to schema:
```
model WishlistItem {
  id        String   @id @default(cuid())
  tenantId  String
  userId    String
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@unique([userId, productId])
}
```
- Add to prisma/schema.prisma
- Run npx prisma db push after
- Server Action: toggle wishlist (add/remove by userId+productId)

### Wishlist UI:
- src/components/store/wishlist-button.tsx — heart icon on product cards/detail, toggles filled/unfilled
- src/app/(store)/wishlist/page.tsx — customer wishlist page showing saved items grid
- Nav link in nav-switcher

## FIX 3: Customer Order History
- src/app/(store)/orders/page.tsx — list customer's past orders with status, total, date
- src/app/(store)/orders/[id]/page.tsx — order detail with items, status, tracking info
- Query: prisma.order.findMany({ where: { tenantId, email: session.user.email } })
- Note: orders linked by email since customers may not have accounts at purchase time

## FIX 4: My Account Page
- src/app/(store)/account/page.tsx
- Show: name, email, order count, total spent
- Link to orders, wishlist
- Password change form (if credentials provider)

## RULES
- Read existing auth.ts, middleware.ts, layout files before editing
- Use useSession() for auth state in client components
- Run npx prisma db push after schema changes
- npm run build after all changes
- Write summary to .doa/council/JH-008/claude-implementation.md
