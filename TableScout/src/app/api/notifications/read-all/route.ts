import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function POST() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { read: false, watch: { userId: user.id } },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
