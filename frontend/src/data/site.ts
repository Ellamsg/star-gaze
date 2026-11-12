/**
 * All content for the marketing site.
 * Nothing here is wired to the API yet — swap for fetch calls from
 * `backend/` when the booking flow goes live.
 */

export type MenuCategory = "Nails" | "Lashes";

export type MenuItem = {
  id: string;
  name: string;
  duration: string;
  price: number;
  category: MenuCategory;
  /** Short blurb used on the booking page. */
  blurb: string;
};

export const studio = {
  name: "Stargaze",
  suffix: "Nails and lashes studio",
  tagline: "Nails and lashes, booked in one minute. No account, no stress.",
  address: "14 Arden Lane, Studio 3",
  city: "Lekki, Lagos",
  phone: "+234 801 234 5678",
  email: "hello@petalandlash.studio",
  instagram: "https://instagram.com",
  hours: [
    { day: "Mon — Thu", time: "10:00 — 19:00" },
    { day: "Fri", time: "10:00 — 21:00" },
    { day: "Sat", time: "09:00 — 18:00" },
    { day: "Sun", time: "By appointment" },
  ],
};

export const navLinks = [
  { label: "Prices", href: "/#menu" },
  { label: "Our work", href: "/#sets" },
];

export const marqueeItems = ["Book in 1 minute", "Nails", "Lashes", "No login"];

export const steps = [
  {
    title: "Pick your treats",
    body: "Nails, lashes, or both.",
  },
  {
    title: "Choose a time",
    body: "See what's open and tap.",
  },
  {
    title: "Done!",
    body: "Just your name and number.",
  },
];

export const menu: { category: MenuCategory; items: MenuItem[] }[] = [
  {
    category: "Nails",
    items: [
      {
        id: "n1",
        name: "Gel manicure",
        duration: "60 min",
        price: 12000,
        category: "Nails",
        blurb: "Shaped, buffed and finished with a high-gloss gel that lasts.",
      },
      {
        id: "n2",
        name: "Acrylic full set",
        duration: "90 min",
        price: 20000,
        category: "Nails",
        blurb: "Hand-sculpted extensions in your shape and colour of choice.",
      },
      {
        id: "n3",
        name: "Nail art add-on",
        duration: "30 min",
        price: 5000,
        category: "Nails",
        blurb: "Freehand linework, chrome or micro-French. Add to any set.",
      },
    ],
  },
  {
    category: "Lashes",
    items: [
      {
        id: "l1",
        name: "Classic set",
        duration: "90 min",
        price: 18000,
        category: "Lashes",
        blurb: "One extension per lash for a clean, mascara-style finish.",
      },
      {
        id: "l2",
        name: "Volume set",
        duration: "120 min",
        price: 25000,
        category: "Lashes",
        blurb: "Hand-fanned 3D–5D lashes for a full, fluffy lash line.",
      },
      {
        id: "l3",
        name: "Lash refill",
        duration: "60 min",
        price: 12000,
        category: "Lashes",
        blurb: "A top-up for sets that need a refresh after two to three weeks.",
      },
    ],
  },
];

export const freshSets = [
  { name: "Milk pink", variant: "blush" as const, sparkle: false },
  { name: "Lilac sparkle", variant: "lilac" as const, sparkle: true },
  { name: "Cherry gloss", variant: "cherry" as const, sparkle: false },
];

/** ₦12,000 — manual so server and client always render the same string. */
export function formatNaira(value: number): string {
  return `₦${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export const footerLinks = [
  { label: "Prices", href: "/#menu" },
  { label: "Our work", href: "/#sets" },
  { label: "Nail studio", href: "/nails" },
  { label: "Try on", href: "/try-on" },
  { label: "Book", href: "/booking" },
];
