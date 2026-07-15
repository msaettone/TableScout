import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/sessionCookie";

export { SESSION_COOKIE };
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function hashToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function createSession(userId: string) {
  const rawToken = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      id: hashToken(rawToken),
      userId,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
  });
  return rawToken;
}

export async function destroySession(rawToken: string) {
  await prisma.session.delete({ where: { id: hashToken(rawToken) } }).catch(() => {});
}

export async function getUserForSessionToken(rawToken: string) {
  const session = await prisma.session.findUnique({
    where: { id: hashToken(rawToken) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}
