import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.restaurant.count();
  if (count === 0) {
    console.log("No data found — seeding demo restaurants and watches...");
    execSync("tsx prisma/seed.ts", { stdio: "inherit" });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
