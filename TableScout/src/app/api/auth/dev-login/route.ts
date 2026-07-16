import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { SESSION_COOKIE } from "@/lib/sessionCookie";

// Local-dev-only convenience: skips real email-link verification entirely.
// Disabled outside development so this can never ship as a real backdoor.
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const user = await prisma.user.upsert({
    where: { email: "dev@tablescout.test" },
    update: {},
    create: { email: "dev@tablescout.test" },
  });

  const sessionToken = await createSession(user.id);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return NextResponse.json({ ok: true });
}
