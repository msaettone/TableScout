import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserOrResponse } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  const auth = await requireUserOrResponse();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const { token } = await req.json();
  if (!token || typeof token !== "string" || token.trim().length < 10) {
    return NextResponse.json({ error: "That doesn't look like a valid token." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resyAuthTokenEnc: encrypt(token.trim()),
      resyTokenUpdatedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const auth = await requireUserOrResponse();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  await prisma.user.update({
    where: { id: user.id },
    data: { resyAuthTokenEnc: null, resyTokenUpdatedAt: null },
  });

  return NextResponse.json({ ok: true });
}
