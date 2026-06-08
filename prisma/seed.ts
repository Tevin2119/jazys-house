/**
 * Seed script — imports the static-site catalog into the database.
 *
 * Source of truth: C:\Users\Tevin\jazyshouse\js\main.js (`products` array).
 * Prices in the source are whole GBP units (£85) and are converted to integer
 * pence here (8500), matching the `Int` money columns in the schema.
 *
 * Run:  npm run db:seed   (requires a real DATABASE_URL + applied migrations)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugify, toMinorUnits } from "../src/lib/utils";
import { DEFAULT_CATEGORIES } from "../src/lib/tenant-defaults";

const prisma = new PrismaClient();

const CATEGORY_NAME = new Map(DEFAULT_CATEGORIES.map((c) => [c.slug, c.name]));

interface SeedProduct {
  name: string;
  category: string;
  price: number; // whole GBP, as in the static catalog
  emoji: string;
  img?: string | null;
  badge?: string | null;
  badgeClass?: string;
}

// Transcribed verbatim from js/main.js `products`.
const PRODUCTS: SeedProduct[] = [
  // WOMEN'S CLOTHING
  { name: "Ankara Print Maxi Dress", category: "women", price: 85, emoji: "👗", img: "images/dress-navy-orange.jpg", badge: "BESTSELLER" },
  { name: "Kente Wrap Skirt", category: "women", price: 65, emoji: "👘", img: null, badge: null },
  { name: "Hand-Dyed Bogolan Top", category: "women", price: 55, emoji: "👚", img: "images/dress-red-pattern.jpg", badge: "NEW", badgeClass: "new" },
  { name: "Dashiki Tunic Dress", category: "women", price: 70, emoji: "👗", img: "images/dashiki-casual.jpg", badge: null },
  { name: "Wax Print Palazzo Pants", category: "women", price: 60, emoji: "👖", img: null, badge: "SALE", badgeClass: "sale" },
  { name: "Kitenge Blazer Jacket", category: "women", price: 95, emoji: "🧥", img: "images/jacket-maroon-mom-child.jpg", badge: "LIMITED" },
  { name: "Aso Oke Statement Blouse", category: "women", price: 75, emoji: "👔", img: "images/suit-maroon-gold.jpg", badge: "NEW", badgeClass: "new" },
  { name: "Mudcloth Print Jumpsuit", category: "women", price: 90, emoji: "👗", img: null, badge: null },

  // MEN'S CLOTHING
  { name: "Kente Print Button-Up Shirt", category: "men", price: 65, emoji: "👔", img: "images/mens-colorful-shirt.jpg", badge: "BESTSELLER" },
  { name: "Handwoven Agbada Set", category: "men", price: 150, emoji: "🪡", img: null, badge: "PREMIUM" },
  { name: "Dashiki Classic Fit", category: "men", price: 50, emoji: "👕", img: "images/mens-jacket.jpg", badge: null },
  { name: "Ankara Print Bomber Jacket", category: "men", price: 110, emoji: "🧥", img: "images/jacket-yellow-blue.jpg", badge: "NEW", badgeClass: "new" },
  { name: "Mudcloth Cargo Trousers", category: "men", price: 75, emoji: "👖", badge: null },
  { name: "Bogolan Print Short Sleeve", category: "men", price: 45, emoji: "👕", badge: "SALE", badgeClass: "sale" },

  // KIDS
  { name: "Mini Ankara Dress", category: "kids", price: 35, emoji: "👗", badge: "NEW", badgeClass: "new" },
  { name: "Kids Dashiki Set", category: "kids", price: 40, emoji: "👕", badge: null },
  { name: "Toddler Kente Romper", category: "kids", price: 30, emoji: "👶", badge: "BESTSELLER" },
  { name: "Children's Wax Print Shirt", category: "kids", price: 28, emoji: "👔", badge: null },
  { name: "Junior Mudcloth Joggers", category: "kids", price: 32, emoji: "👖", badge: "LIMITED" },
  { name: "Baby Ankara Headwrap Set", category: "kids", price: 22, emoji: "🧢", badge: null },

  // HANDMADE ACCESSORIES
  { name: "Ankara Tote Bag", category: "accessories", price: 45, emoji: "👜", img: "images/dress-baskets.jpg", badge: "BESTSELLER" },
  { name: "Beaded Maasai Necklace", category: "accessories", price: 38, emoji: "📿", img: "images/accessories-beads.jpg", badge: "HANDMADE" },
  { name: "Kente Print Headwrap", category: "accessories", price: 25, emoji: "🧣", img: "images/bracelet-pink-white.jpg", badge: null },
  { name: "Cowrie Shell Earrings", category: "accessories", price: 30, emoji: "✨", img: "images/bracelet-purple-flower.jpg", badge: "NEW", badgeClass: "new" },
  { name: "Handwoven Raffia Clutch", category: "accessories", price: 55, emoji: "👛", img: "images/beaded-keychain.jpg", badge: "ARTISAN" },
  { name: "Brass Cuff Bracelet Set", category: "accessories", price: 42, emoji: "💫", badge: null },
  { name: "Wax Print Scrunchie Set (3)", category: "accessories", price: 18, emoji: "🎀", badge: "SALE", badgeClass: "sale" },
  { name: "Ankara Pocket Square", category: "accessories", price: 20, emoji: "🧶", badge: null },
  { name: "Handmade Beaded Phone Charm", category: "accessories", price: 15, emoji: "📱", img: "images/phone-charms-set.jpg", badge: "NEW", badgeClass: "new" },
  { name: "Heart Bead Bracelet — Rainbow", category: "accessories", price: 12, emoji: "💖", img: "images/heart-bracelets.jpg", badge: "CUTE" },
  { name: "Floral Beaded Keychain", category: "accessories", price: 10, emoji: "🔑", img: "images/keychain-floral.jpg", badge: "HANDMADE" },

  // AFRICAN SUPERFOODS / PANTRY
  { name: "Dried Hibiscus Flowers (Zobo)", category: "pantry", price: 12, emoji: "🌺", img: "images/hibiscus-tea-packaging.jpg", badge: "BESTSELLER" },
  { name: "Organic Moringa Powder", category: "pantry", price: 15, emoji: "🌿", img: "images/moringa-powder-packaging.jpg", badge: "SUPERFOOD", badgeClass: "new" },
  { name: "Pure Baobab Powder", category: "pantry", price: 16, emoji: "🫙", img: "images/baobab-powder-packaging.jpg", badge: "NEW", badgeClass: "new" },
  { name: "Hibiscus & Ginger Tea Blend", category: "pantry", price: 10, emoji: "🍵", badge: null },
  { name: "Moringa & Baobab Smoothie Mix", category: "pantry", price: 18, emoji: "🥤", badge: "IMMUNE" },
  { name: "African Superfood Bundle (3-Pack)", category: "pantry", price: 38, emoji: "🎁", badge: "BEST VALUE", badgeClass: "sale" },
  { name: "Café Touba — Senegalese Spiced Coffee", category: "pantry", price: 14, emoji: "☕", img: "images/cafe-touba-packaging.jpg", badge: "ARTISAN" },
  { name: "Baobab Oil — 100% Organic (Dropper)", category: "pantry", price: 22, emoji: "✨", img: "images/baobab-oil-dropper.jpg", badge: "100% BIO", badgeClass: "new" },
  { name: "Baobab Oil — Body & Face (Spray)", category: "pantry", price: 18, emoji: "💫", img: "images/baobab-oil-spray.jpg", badge: "NEW", badgeClass: "new" },

  // HOME DÉCOR — African Textiles (Handmade)
  { name: "Handmade Navy Geo-Pattern Pillow", category: "home", price: 35, emoji: "🛋️", img: "images/pillow-navy-geo.jpg", badge: "HANDMADE" },
  { name: "Handmade Cream & Black Stripe Pillow", category: "home", price: 32, emoji: "🛋️", img: "images/pillow-cream-stripe.jpg", badge: "HANDMADE" },
  { name: "Handmade Maroon Striped Pillow", category: "home", price: 30, emoji: "🛋️", img: "images/pillow-maroon-stripe.jpg", badge: "HANDMADE" },
  { name: "Handmade Green Gingham Pillow", category: "home", price: 28, emoji: "🛋️", img: "images/pillow-green-gingham.jpg", badge: "HANDMADE" },
  { name: "Handmade Stripe Bow-Accent Pillow", category: "home", price: 34, emoji: "🛋️", img: "images/pillow-stripe-bow.jpg", badge: "HANDMADE" },
  { name: "Handmade African Woven Fan", category: "home", price: 130, emoji: "🪭", img: "images/fan-woven.jpg", badge: "ARTISAN" },
  { name: "Decorative Storage Box — Small", category: "home", price: 22, emoji: "📦", img: "images/box-decorative-1.jpg", badge: "HANDMADE" },
  { name: "Decorative Storage Box — Medium", category: "home", price: 28, emoji: "📦", img: "images/box-decorative-2.jpg", badge: "HANDMADE" },
  { name: "Decorative Storage Box — Large", category: "home", price: 35, emoji: "📦", img: "images/box-decorative-3.jpg", badge: "HANDMADE" },
  { name: "Hand-Carved African Wood Statue — Small", category: "home", price: 26, emoji: "🪵", img: "images/statue-wood-1.jpg", badge: "ARTISAN" },
  { name: "Hand-Carved African Wood Statue — Medium", category: "home", price: 35, emoji: "🪵", img: "images/statue-wood-2.jpg", badge: "ARTISAN" },
  { name: "Hand-Carved African Wood Statue — Large", category: "home", price: 48, emoji: "🪵", img: "images/statue-wood-3.jpg", badge: "ARTISAN", badgeClass: "new" },
  { name: "Hand-Carved African Wood Figure — Grand", category: "home", price: 58, emoji: "🪵", img: "images/statue-wood-4.jpg", badge: "PREMIUM" },
];

interface TenantSeed {
  name: string;
  slug: string;
  domain: string | null;
  currency: string;
  theme: { primary: string; secondary: string; font: string };
  /** Category slugs this store carries (names come from DEFAULT_CATEGORIES). */
  categorySlugs: string[];
  /** Products to stock — a subset of the shared catalog. */
  products: SeedProduct[];
  owner: { email: string; name: string };
}

// Demo tenants — three storefronts, each with its own theme + catalog subset.
const TENANTS: TenantSeed[] = [
  {
    name: "Jazy's House Tokyo",
    slug: "jazyshouse",
    domain: "jazyshouse.com",
    currency: "gbp",
    theme: { primary: "#c0563d", secondary: "#f0e6d3", font: "'DM Sans', sans-serif" },
    categorySlugs: ["women", "men", "kids", "accessories", "pantry", "home"],
    products: PRODUCTS, // full catalog
    owner: { email: "owner@jazyshouse.com", name: "Dienaba (Store Owner)" },
  },
  {
    name: "AfroChic London",
    slug: "afrochic",
    domain: "afrochic.london",
    currency: "gbp",
    theme: { primary: "#1f5132", secondary: "#efe3c2", font: "'Playfair Display', serif" },
    categorySlugs: ["women", "men", "accessories"],
    products: PRODUCTS.filter((p) =>
      ["women", "men", "accessories"].includes(p.category),
    ),
    owner: { email: "owner@afrochic.london", name: "AfroChic Owner" },
  },
  {
    name: "Baobab Market",
    slug: "baobab",
    domain: "baobabmarket.com",
    currency: "eur",
    theme: { primary: "#b5651d", secondary: "#f6e7c1", font: "'Inter', sans-serif" },
    categorySlugs: ["pantry", "home"],
    products: PRODUCTS.filter((p) => ["pantry", "home"].includes(p.category)),
    owner: { email: "owner@baobabmarket.com", name: "Baobab Owner" },
  },
];

async function seedTenant(def: TenantSeed, passwordHash: string): Promise<void> {
  console.log(`Seeding tenant "${def.name}" (${def.slug})...`);

  const tenant = await prisma.tenant.upsert({
    where: { slug: def.slug },
    update: {
      name: def.name,
      domain: def.domain,
      currency: def.currency,
      theme: def.theme,
    },
    create: {
      name: def.name,
      slug: def.slug,
      domain: def.domain,
      currency: def.currency,
      theme: def.theme,
    },
  });

  // Categories — upsert by (tenantId, slug) so re-seeding is idempotent.
  const categoryIdBySlug = new Map<string, string>();
  for (const slug of def.categorySlugs) {
    const name = CATEGORY_NAME.get(slug) ?? slug;
    const record = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug } },
      update: { name },
      create: { tenantId: tenant.id, slug, name },
    });
    categoryIdBySlug.set(slug, record.id);
  }

  // Products — slug unique per tenant; re-seedable via upsert on (tenantId, slug).
  const usedSlugs = new Set<string>();
  for (const p of def.products) {
    let slug = slugify(p.name);
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      slug = `${slugify(p.name)}-${suffix++}`;
    }
    usedSlugs.add(slug);

    const data = {
      name: p.name,
      price: toMinorUnits(p.price),
      emoji: p.emoji,
      images: p.img ? [p.img] : [],
      badge: p.badge ?? null,
      badgeClass: p.badgeClass ?? null,
      categoryId: categoryIdBySlug.get(p.category) ?? null,
    };

    await prisma.product.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug } },
      update: data,
      create: { tenantId: tenant.id, slug, ...data },
    });
  }

  // First TENANT_ADMIN owner for this store.
  await prisma.user.upsert({
    where: { email: def.owner.email },
    update: {
      name: def.owner.name,
      role: "TENANT_ADMIN",
      tenantId: tenant.id,
      passwordHash,
    },
    create: {
      email: def.owner.email,
      name: def.owner.name,
      role: "TENANT_ADMIN",
      tenantId: tenant.id,
      passwordHash,
    },
  });

  console.log(
    `  ✓ ${def.categorySlugs.length} categories, ${def.products.length} products, owner ${def.owner.email}`,
  );
}

async function main() {
  // The password comes from env so a real secret never lives in source; a dev
  // default keeps `db:seed` usable.
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  for (const def of TENANTS) {
    await seedTenant(def, passwordHash);
  }

  // Platform super admin — spans all tenants (tenantId: null).
  await prisma.user.upsert({
    where: { email: "admin@jazyshouse.com" },
    update: {
      name: "Tevin (Platform Admin)",
      role: "SUPER_ADMIN",
      tenantId: null,
      passwordHash,
    },
    create: {
      email: "admin@jazyshouse.com",
      name: "Tevin (Platform Admin)",
      role: "SUPER_ADMIN",
      tenantId: null,
      passwordHash,
    },
  });
  console.log(
    `Seeded ${TENANTS.length} tenants + 1 SUPER_ADMIN (admin@jazyshouse.com).`,
  );
  console.log("Seed complete ✓");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
