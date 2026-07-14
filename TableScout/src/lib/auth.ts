import { prisma } from "@/lib/prisma";

// TEMPORARY (Phase 1 only): there's no real session/login yet, so every
// request is attributed to one seeded placeholder user. Phase 2 replaces
// this implementation with real cookie/session-backed lookups — callers
// (API routes) already call requireUser() the same way real auth will need,
// so nothing at the call sites should need to change when that lands.
const DEMO_PHONE = "+10000000000";

export async function requireUser() {
  const user = await prisma.user.findUnique({ where: { phone: DEMO_PHONE } });
  if (!user) {
    throw new Error("Demo user not seeded — run `npm run db:seed`.");
  }
  return user;
}
