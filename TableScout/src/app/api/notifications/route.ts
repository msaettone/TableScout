import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserOrResponse } from "@/lib/auth";
import { tick } from "@/lib/watchEngine";

export async function GET() {
  await tick();
  const auth = await requireUserOrResponse();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const notifications = await prisma.notification.findMany({
    where: { watch: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { watch: { include: { restaurant: true } } },
  });

  return NextResponse.json(notifications);
}
