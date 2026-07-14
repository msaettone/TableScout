import { defineConfig } from "prisma/config";

// Prisma config files opt out of Prisma's automatic .env loading, so load it
// ourselves (Node 20.6+ built-in, no dotenv dependency needed).
try {
  process.loadEnvFile();
} catch {
  // no .env file present (e.g. production, where env vars are injected directly)
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
