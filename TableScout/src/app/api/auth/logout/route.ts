import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession } from "@/lib/session";
import { SESSION_COOKIE } from "@/lib/sessionCookie";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await destroySession(token);
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
