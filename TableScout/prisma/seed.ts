import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fixed ids (not Resy-linked) so this seed stays idempotent without needing
// a unique constraint on `name` — real Resy venues can share display names
// across locations, so `name` can't be the identity key for the catalog.
const restaurants = [
  { id: "seed-lumen", name: "Lumen", cuisine: "New American", neighborhood: "West Village", priceRange: "$$$$" },
  { id: "seed-ember-salt", name: "Ember & Salt", cuisine: "Wood-Fired", neighborhood: "Fort Greene", priceRange: "$$$" },
  { id: "seed-casa-verde", name: "Casa Verde", cuisine: "Modern Mexican", neighborhood: "Nolita", priceRange: "$$$" },
  { id: "seed-marea-blu", name: "Marea Blu", cuisine: "Coastal Italian", neighborhood: "Tribeca", priceRange: "$$$$" },
  { id: "seed-kohaku", name: "Kōhaku", cuisine: "Omakase", neighborhood: "Flatiron", priceRange: "$$$$" },
  { id: "seed-copper-room", name: "The Copper Room", cuisine: "French Bistro", neighborhood: "Chelsea", priceRange: "$$$" },
];

async function main() {
  // Only ever touches the shared restaurant catalog — never Users/Watches,
  // since those belong to real accounts now that auth exists.
  for (const { id, ...data } of restaurants) {
    await prisma.restaurant.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }

  console.log(`Seeded ${restaurants.length} restaurants.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
