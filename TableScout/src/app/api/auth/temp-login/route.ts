import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { SESSION_COOKIE } from "@/lib/sessionCookie";

// Temporary, one-off convenience: lets the project owner log into their real
// account with a single click instead of the email-link flow, while setting
// up their production dashboard for the first time. Gated by a dedicated
// secret (TEMP_LOGIN_SECRET, set only as a Vercel env var, never committed)
// that is unset and this route removed right after use — not a permanent
// backdoor.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || !process.env.TEMP_LOGIN_SECRET || secret !== process.env.TEMP_LOGIN_SECRET) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const email = "saettonemauricio@gmail.com";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const token = await createSession(user.id);

  const res = NextResponse.redirect(new URL("/dashboard", req.url));
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
