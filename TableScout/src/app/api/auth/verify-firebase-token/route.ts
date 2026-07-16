import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { SESSION_COOKIE } from "@/lib/sessionCookie";
import { getFirebaseAdminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();
  if (!idToken) {
    return NextResponse.json({ error: "Missing idToken." }, { status: 400 });
  }

  let email: string | undefined;
  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(idToken);
    // Email-link sign-in only issues a token after the user proved control
    // of the inbox by clicking the link, so email_verified is always true
    // here — checked anyway since this claim is what we trust as identity.
    if (decoded.email_verified) email = decoded.email;
  } catch {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
  }

  if (!email) {
    return NextResponse.json({ error: "Token did not include a verified email." }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const sessionToken = await createSession(user.id);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return NextResponse.json({ ok: true });
}
