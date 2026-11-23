import "dotenv/config";

import { prisma } from "../src/lib/prisma";

/**
 * Keeps the database service catalogue in sync with the booking page menu
 * (frontend/src/data/site.ts). Safe to run repeatedly.
 */
const categories = [
  { name: "Nails", slug: "nails", sortOrder: 0 },
  { name: "Lashes", slug: "lashes", sortOrder: 1 },
] as const;

const services = [
  { name: "Gel manicure", slug: "gel-manicure", durationMin: 60, price: 12000, category: "nails" },
  { name: "Acrylic full set", slug: "acrylic-full-set", durationMin: 90, price: 20000, category: "nails" },
  { name: "Nail art add-on", slug: "nail-art-add-on", durationMin: 30, price: 5000, category: "nails" },
  { name: "Classic set", slug: "classic-set", durationMin: 90, price: 18000, category: "lashes" },
  { name: "Volume set", slug: "volume-set", durationMin: 120, price: 25000, category: "lashes" },
  { name: "Lash refill", slug: "lash-refill", durationMin: 60, price: 12000, category: "lashes" },
] as const;

async function main() {
  const categoryIds = new Map<string, string>();

  for (const category of categories) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      create: { ...category, active: true },
      update: { name: category.name, sortOrder: category.sortOrder },
    });
    categoryIds.set(category.slug, row.id);
  }

  for (const service of services) {
    const categoryId = categoryIds.get(service.category) ?? null;

    await prisma.service.upsert({
      where: { slug: service.slug },
      create: {
        name: service.name,
        slug: service.slug,
        durationMin: service.durationMin,
        price: service.price,
        categoryId,
        active: true,
      },
      update: {
        name: service.name,
        durationMin: service.durationMin,
        price: service.price,
        categoryId,
      },
    });
  }

  console.log(
    `Seeded ${categories.length} categories and ${services.length} services.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
