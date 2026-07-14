import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { NotificationType, WatchStatus } from "@prisma/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;

  const watch = await prisma.watch.findUnique({ where: { id, userId: user.id } });
  if (!watch) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (watch.status !== WatchStatus.STRIKE_MODE && watch.status !== WatchStatus.ACTION_NEEDED) {
    return NextResponse.json(
      { error: "This watch is not currently bookable." },
      { status: 409 }
    );
  }

  const updated = await prisma.watch.update({
    where: { id },
    data: { status: WatchStatus.BOOKING },
    include: { restaurant: true, notifications: { orderBy: { createdAt: "desc" } } },
  });

  await prisma.notification.create({
    data: {
      watchId: id,
      type: NotificationType.INFO,
      message: "booking request sent — confirming your table now.",
    },
  });

  return NextResponse.json(updated);
}
