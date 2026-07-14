import { PrismaClient, WatchStatus } from "@prisma/client";

const prisma = new PrismaClient();

const restaurants = [
  { name: "Lumen", cuisine: "New American", neighborhood: "West Village", priceRange: "$$$$" },
  { name: "Ember & Salt", cuisine: "Wood-Fired", neighborhood: "Fort Greene", priceRange: "$$$" },
  { name: "Casa Verde", cuisine: "Modern Mexican", neighborhood: "Nolita", priceRange: "$$$" },
  { name: "Marea Blu", cuisine: "Coastal Italian", neighborhood: "Tribeca", priceRange: "$$$$" },
  { name: "Kōhaku", cuisine: "Omakase", neighborhood: "Flatiron", priceRange: "$$$$" },
  { name: "The Copper Room", cuisine: "French Bistro", neighborhood: "Chelsea", priceRange: "$$$" },
];

function minutesFromNow(min: number) {
  return new Date(Date.now() + min * 60_000);
}

async function main() {
  await prisma.notification.deleteMany();
  await prisma.watch.deleteMany();
  await prisma.restaurant.deleteMany();

  // Placeholder single user until Phase 2 real auth lands — see src/lib/auth.ts.
  const demoUser = await prisma.user.upsert({
    where: { phone: "+10000000000" },
    update: {},
    create: { phone: "+10000000000" },
  });

  const created = await Promise.all(
    restaurants.map((r) => prisma.restaurant.create({ data: r }))
  );

  const byName = (n: string) => created.find((r) => r.name === n)!;

  const watchSeeds: Array<{
    restaurant: string;
    partySize: number;
    preferredTimes: string[];
    releaseInMinutes: number;
    status: WatchStatus;
    confirmedTime?: string;
  }> = [
    {
      restaurant: "Kōhaku",
      partySize: 2,
      preferredTimes: ["19:00", "19:30", "20:00"],
      releaseInMinutes: 3,
      status: WatchStatus.STRIKE_MODE,
    },
    {
      restaurant: "Lumen",
      partySize: 4,
      preferredTimes: ["18:30", "19:00"],
      releaseInMinutes: 45,
      status: WatchStatus.RELEASE_APPROACHING,
    },
    {
      restaurant: "Marea Blu",
      partySize: 2,
      preferredTimes: ["20:00", "20:30", "21:00"],
      releaseInMinutes: 60 * 24 * 5,
      status: WatchStatus.WATCHING,
    },
    {
      restaurant: "Casa Verde",
      partySize: 3,
      preferredTimes: ["19:30"],
      releaseInMinutes: -60 * 2,
      status: WatchStatus.BOOKED,
      confirmedTime: "19:30",
    },
    {
      restaurant: "The Copper Room",
      partySize: 2,
      preferredTimes: ["18:00", "18:30"],
      releaseInMinutes: -20,
      status: WatchStatus.ACTION_NEEDED,
    },
    {
      restaurant: "Ember & Salt",
      partySize: 5,
      preferredTimes: ["19:00"],
      releaseInMinutes: -60 * 24,
      status: WatchStatus.EXPIRED,
    },
  ];

  for (const w of watchSeeds) {
    await prisma.watch.create({
      data: {
        userId: demoUser.id,
        restaurantId: byName(w.restaurant).id,
        partySize: w.partySize,
        preferredTimes: w.preferredTimes,
        targetDate: minutesFromNow(60 * 24 * 3),
        releaseAt: minutesFromNow(w.releaseInMinutes),
        status: w.status,
        confirmedTime: w.confirmedTime,
      },
    });
  }

  console.log(`Seeded ${created.length} restaurants and ${watchSeeds.length} watches.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
