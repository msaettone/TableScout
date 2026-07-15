import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserOrResponse } from "@/lib/auth";

export async function POST() {
  const auth = await requireUserOrResponse();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  await prisma.notification.updateMany({
    where: { read: false, watch: { userId: user.id } },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
