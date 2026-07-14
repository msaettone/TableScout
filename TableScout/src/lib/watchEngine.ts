import { prisma } from "@/lib/prisma";
import { NotificationType, WatchStatus } from "@prisma/client";

const MINUTE = 60_000;

export async function tick() {
  const now = Date.now();

  const watches = await prisma.watch.findMany({
    where: { status: { notIn: [WatchStatus.BOOKED, WatchStatus.EXPIRED] } },
  });

  for (const w of watches) {
    const msToRelease = w.releaseAt.getTime() - now;

    if (w.status === WatchStatus.WATCHING && msToRelease <= 24 * 60 * MINUTE) {
      await transition(
        w.id,
        WatchStatus.RELEASE_APPROACHING,
        NotificationType.RELEASE_APPROACHING,
        "reservations release soon — we'll alert you the moment the window opens."
      );
      continue;
    }

    if (w.status === WatchStatus.RELEASE_APPROACHING && msToRelease <= MINUTE) {
      await transition(
        w.id,
        WatchStatus.STRIKE_MODE,
        NotificationType.STRIKE_MODE,
        "Strike Mode is live — the booking window is about to open."
      );
      continue;
    }

    if (w.status === WatchStatus.STRIKE_MODE && msToRelease < -3 * MINUTE) {
      await transition(
        w.id,
        WatchStatus.ACTION_NEEDED,
        NotificationType.ACTION_NEEDED,
        "the release window opened — check availability and book manually."
      );
      continue;
    }

    if (w.status === WatchStatus.ACTION_NEEDED && msToRelease < -15 * MINUTE) {
      await transition(
        w.id,
        WatchStatus.EXPIRED,
        NotificationType.EXPIRED,
        "this watch has expired without a confirmed booking."
      );
      continue;
    }

    if (w.status === WatchStatus.BOOKING && now - w.updatedAt.getTime() > 3500) {
      const confirmedTime = w.preferredTimes[0] ?? "19:00";
      await prisma.watch.update({
        where: { id: w.id },
        data: { status: WatchStatus.BOOKED, confirmedTime },
      });
      await prisma.notification.create({
        data: {
          watchId: w.id,
          type: NotificationType.BOOKED,
          message: `booked for ${confirmedTime} — confirmation sent.`,
        },
      });
    }
  }
}

async function transition(
  watchId: string,
  status: WatchStatus,
  type: NotificationType,
  message: string
) {
  await prisma.watch.update({ where: { id: watchId }, data: { status } });
  await prisma.notification.create({ data: { watchId, type, message } });
}
