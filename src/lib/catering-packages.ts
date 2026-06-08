/**
 * Catering packages — service offerings, NOT DB products.
 *
 * Transcribed from the static site's `cateringMenu` (jazyshouse/js/main.js).
 * These are fixed marketing offerings rather than purchasable inventory, so they
 * live in code (shared by the home teaser and the catering page) instead of the
 * tenant-scoped product catalog. The `value` is the option value submitted with
 * a catering inquiry.
 */
export interface CateringPackage {
  value: string;
  name: string;
  desc: string;
  price: string;
  emoji: string;
}

export const CATERING_PACKAGES: CateringPackage[] = [
  {
    value: "platter",
    name: "Taste of Africa Platter",
    desc: "Jollof rice, suya skewers, puff-puff, plantain — a complete African feast",
    price: "from £22/pp",
    emoji: "🍛",
  },
  {
    value: "braai",
    name: "Braai Experience",
    desc: "South African-style barbecue — boerewors, grilled meats, chakalaka, pap",
    price: "from £28/pp",
    emoji: "🥩",
  },
  {
    value: "west",
    name: "West African Banquet",
    desc: "Egusi soup, fufu, jollof, fried rice, moin moin — full spread",
    price: "from £30/pp",
    emoji: "🍲",
  },
  {
    value: "east",
    name: "East African Feast",
    desc: "Nyama choma, ugali, samosas, kachumbari, chapati station",
    price: "from £25/pp",
    emoji: "🍖",
  },
  {
    value: "dessert",
    name: "African Dessert Table",
    desc: "Chin chin, puff-puff tower, malva pudding, koeksisters, bissap shots",
    price: "from £15/pp",
    emoji: "🍩",
  },
  {
    value: "full",
    name: "Full Event Catering",
    desc: "End-to-end African catering — custom menu, staff, setup, full service",
    price: "Custom quote",
    emoji: "🎉",
  },
];

export const CATERING_PACKAGE_VALUES = CATERING_PACKAGES.map((p) => p.value);
