import "dotenv/config";

import { prisma } from "../src/lib/prisma";

/**
 * Keeps the database service catalogue in sync with the booking page menu
 * (frontend/src/data/site.ts). Safe to run repeatedly.
 */
const services = [
  { name: "Gel manicure", slug: "gel-manicure", durationMin: 60, price: 12000 },
  { name: "Acrylic full set", slug: "acrylic-full-set", durationMin: 90, price: 20000 },
  { name: "Nail art add-on", slug: "nail-art-add-on", durationMin: 30, price: 5000 },
  { name: "Classic set", slug: "classic-set", durationMin: 90, price: 18000 },
  { name: "Volume set", slug: "volume-set", durationMin: 120, price: 25000 },
  { name: "Lash refill", slug: "lash-refill", durationMin: 60, price: 12000 },
];

async function main() {
  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      create: { ...service, active: true },
      update: {
        name: service.name,
        durationMin: service.durationMin,
        price: service.price,
      },
    });
  }

  console.log(`Seeded ${services.length} services.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
