/**
 * Defaults applied when a new tenant is provisioned.
 *
 * Shared by the admin "create tenant" action and `prisma/seed.ts` so a new
 * store always starts with the same baseline category set. Keep this dependency
 * light (no server-only imports) — the seed script runs outside Next.js.
 */

export interface CategorySeed {
  slug: string;
  name: string;
}

/** Baseline categories every new tenant is provisioned with. */
export const DEFAULT_CATEGORIES: CategorySeed[] = [
  { slug: "women", name: "Women's Clothing" },
  { slug: "men", name: "Men's Clothing" },
  { slug: "kids", name: "Kids" },
  { slug: "accessories", name: "Handmade Accessories" },
  { slug: "pantry", name: "African Superfoods" },
  { slug: "home", name: "Home Décor" },
];
