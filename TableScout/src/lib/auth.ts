import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, getUserForSessionToken } from "@/lib/session";
import type { User } from "@prisma/client";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getUserForSessionToken(token);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/** For API routes: `const auth = await requireUserOrResponse(); if ("response" in auth) return auth.response;` */
export async function requireUserOrResponse(): Promise<
  { user: User } | { response: NextResponse }
> {
  try {
    return { user: await requireUser() };
  } catch {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
}
