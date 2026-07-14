import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { tick } from "@/lib/watchEngine";
import { NotificationType, WatchStatus } from "@prisma/client";

const STATUS_PRIORITY: Record<WatchStatus, number> = {
  STRIKE_MODE: 0,
  ACTION_NEEDED: 1,
  BOOKING: 2,
  RELEASE_APPROACHING: 3,
  WATCHING: 4,
  BOOKED: 5,
  EXPIRED: 6,
};

export async function GET() {
  await tick();
  const user = await requireUser();

  const watches = await prisma.watch.findMany({
    where: { userId: user.id },
    include: { restaurant: true },
  });

  watches.sort((a, b) => {
    const diff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (diff !== 0) return diff;
    return a.releaseAt.getTime() - b.releaseAt.getTime();
  });

  return NextResponse.json(watches);
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json();
  const { restaurantId, partySize, preferredTimes, targetDate, releaseAt } = body;

  if (!restaurantId || !partySize || !preferredTimes?.length || !targetDate || !releaseAt) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const watch = await prisma.watch.create({
    data: {
      userId: user.id,
      restaurantId,
      partySize: Number(partySize),
      preferredTimes,
      targetDate: new Date(targetDate),
      releaseAt: new Date(releaseAt),
      status: WatchStatus.WATCHING,
    },
    include: { restaurant: true },
  });

  await prisma.notification.create({
    data: {
      watchId: watch.id,
      type: NotificationType.INFO,
      message: "watch created — we'll notify you as the release approaches.",
    },
  });

  return NextResponse.json(watch, { status: 201 });
}
