import { prisma } from "@/lib/prisma";
import { sendPush } from "@/lib/push";
import { getAvailability, matchPreferredSlot, getBookingToken, book as resyBook } from "@/lib/resy/client";
import { getDecryptedResyToken } from "@/lib/resy/userAuth";
import { ResyError } from "@/lib/resy/errors";
import { NotificationType, WatchStatus, type Restaurant, type User, type Watch } from "@prisma/client";

const MINUTE = 60_000;

// Statuses worth interrupting someone's day for; INFO/RELEASE_APPROACHING
// stay in-app-only (the bell) to avoid notification fatigue.
const PUSH_WORTHY = new Set<NotificationType>([
  NotificationType.STRIKE_MODE,
  NotificationType.BOOKED,
  NotificationType.ACTION_NEEDED,
]);

type WatchWithRelations = Watch & { restaurant: Restaurant; user: User };

// Module-level: if Resy rate-limits us, back off ALL Resy polling for a
// while rather than hammering it again on the very next watch/tick.
let resyCooldownUntil = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function tick(limit?: number) {
  const now = Date.now();

  const watches = await prisma.watch.findMany({
    where: {
      status: { notIn: [WatchStatus.BOOKED, WatchStatus.EXPIRED] },
      nextCheckAt: { lte: new Date(now) },
    },
    // Oldest-due first so a capped invocation (e.g. the external cron route,
    // bounded by a serverless function timeout) doesn't starve watches that
    // have been waiting longest.
    orderBy: { nextCheckAt: "asc" },
    ...(limit ? { take: limit } : {}),
    include: { restaurant: true, user: true },
  });

  for (const w of watches) {
    if (w.restaurant.resyVenueId) {
      if (Date.now() < resyCooldownUntil) continue;
      await tickResyLinkedWatch(w);
      await sleep(300 + Math.random() * 700);
    } else {
      await tickSimulatedWatch(w, now);
    }
  }
}

/** Original timestamp-based simulation — used for watches not linked to a
 * real Resy venue (no restaurant.resyVenueId), kept as a fallback/demo mode. */
async function tickSimulatedWatch(w: WatchWithRelations, now: number) {
  const msToRelease = w.releaseAt.getTime() - now;

  if (w.status === WatchStatus.WATCHING && msToRelease <= 24 * 60 * MINUTE) {
    await transition(
      w.id,
      w.userId,
      w.restaurant.name,
      WatchStatus.WATCHING,
      WatchStatus.RELEASE_APPROACHING,
      NotificationType.RELEASE_APPROACHING,
      "reservations release soon — we'll alert you the moment the window opens."
    );
    return;
  }

  if (w.status === WatchStatus.RELEASE_APPROACHING && msToRelease <= MINUTE) {
    await transition(
      w.id,
      w.userId,
      w.restaurant.name,
      WatchStatus.RELEASE_APPROACHING,
      WatchStatus.STRIKE_MODE,
      NotificationType.STRIKE_MODE,
      "Strike Mode is live — the booking window is about to open."
    );
    return;
  }

  if (w.status === WatchStatus.STRIKE_MODE && msToRelease < -3 * MINUTE) {
    await transition(
      w.id,
      w.userId,
      w.restaurant.name,
      WatchStatus.STRIKE_MODE,
      WatchStatus.ACTION_NEEDED,
      NotificationType.ACTION_NEEDED,
      "the release window opened — check availability and book manually."
    );
    return;
  }

  if (w.status === WatchStatus.ACTION_NEEDED && msToRelease < -15 * MINUTE) {
    await transition(
      w.id,
      w.userId,
      w.restaurant.name,
      WatchStatus.ACTION_NEEDED,
      WatchStatus.EXPIRED,
      NotificationType.EXPIRED,
      "this watch has expired without a confirmed booking."
    );
    return;
  }

  if (w.status === WatchStatus.BOOKING && now - w.updatedAt.getTime() > 3500) {
    const confirmedTime = w.preferredTimes[0] ?? "19:00";
    await transition(
      w.id,
      w.userId,
      w.restaurant.name,
      WatchStatus.BOOKING,
      WatchStatus.BOOKED,
      NotificationType.BOOKED,
      `booked for ${confirmedTime} — confirmation sent.`,
      { confirmedTime }
    );
  }
}

/** The moment a real matching slot is found, book it immediately — no
 * waiting for a human tap. The user explicitly chose speed over a
 * confirm-before-booking step, accepting that a reservation can land
 * without a last chance to back out. Deposit-required slots are the one
 * case this can't safely auto-complete (no payment flow exists), so those
 * still land in STRIKE_MODE for manual completion via the "Book now" button. */
async function attemptAutoBook(
  w: WatchWithRelations,
  match: NonNullable<ReturnType<typeof matchPreferredSlot>>,
  authToken: string,
  now: number
) {
  const matchedSlotTime = match.date.start.slice(11, 16);
  const day = w.targetDate.toISOString().slice(0, 10);

  try {
    const { bookToken, paymentType } = await getBookingToken({
      authToken,
      configToken: match.config.token,
      day,
      partySize: w.partySize,
    });

    if (paymentType !== "free") {
      if (w.status !== WatchStatus.STRIKE_MODE) {
        await transition(
          w.id,
          w.userId,
          w.restaurant.name,
          w.status,
          WatchStatus.STRIKE_MODE,
          NotificationType.STRIKE_MODE,
          `a table opened at ${matchedSlotTime}, but it needs a deposit — book it directly on Resy or tap Book now.`,
          {
            matchedSlotToken: match.config.token,
            matchedSlotTime,
            lastCheckedAt: new Date(now),
            nextCheckAt: new Date(now + MINUTE),
          }
        );
      } else {
        await prisma.watch.update({
          where: { id: w.id },
          data: {
            matchedSlotToken: match.config.token,
            matchedSlotTime,
            lastCheckedAt: new Date(now),
            nextCheckAt: new Date(now + MINUTE),
          },
        });
      }
      return;
    }

    const { reservationId } = await resyBook({ authToken, bookToken });

    await transition(
      w.id,
      w.userId,
      w.restaurant.name,
      w.status,
      WatchStatus.BOOKED,
      NotificationType.BOOKED,
      `auto-booked for ${matchedSlotTime} — confirmation sent.`,
      {
        confirmedTime: matchedSlotTime,
        resyReservationId: reservationId,
        matchedSlotToken: match.config.token,
        matchedSlotTime,
      }
    );
  } catch (err) {
    // Someone else grabbed it first (or a transient error) — nothing left
    // to book. Note it and keep watching rather than crash the tick loop.
    console.error(`auto-book attempt failed for watch ${w.id}:`, err);
    await prisma.notification.create({
      data: {
        watchId: w.id,
        type: NotificationType.INFO,
        message: `a table opened at ${matchedSlotTime} but we lost the race to book it — still watching.`,
      },
    });
    await prisma.watch.update({
      where: { id: w.id },
      data: { lastCheckedAt: new Date(now), nextCheckAt: new Date(now + 30_000) },
    });
  }
}

/** Real Resy availability polling — status now driven by actual matches
 * found on Resy, not a timer. STRIKE_MODE/ACTION_NEEDED are reused with a
 * different meaning here: STRIKE_MODE = a real slot is open right now;
 * ACTION_NEEDED = our release-time estimate passed with nothing found yet. */
async function tickResyLinkedWatch(w: WatchWithRelations) {
  const now = Date.now();
  const msToRelease = w.releaseAt.getTime() - now;

  // The book route resolves BOOKING synchronously within its own request —
  // nothing for the background tick to do while a booking is in flight.
  if (w.status === WatchStatus.BOOKING) return;

  let authToken: string;
  try {
    authToken = getDecryptedResyToken(w.user);
  } catch {
    // No Resy account connected yet — nudge once the estimate has passed,
    // otherwise just wait quietly (checking every tick would be pointless).
    if (msToRelease < 0 && w.status !== WatchStatus.ACTION_NEEDED) {
      await transition(
        w.id,
        w.userId,
        w.restaurant.name,
        w.status,
        WatchStatus.ACTION_NEEDED,
        NotificationType.ACTION_NEEDED,
        "connect your Resy account in Settings so we can check real availability."
      );
    }
    await prisma.watch.update({
      where: { id: w.id },
      data: { nextCheckAt: new Date(now + 30 * MINUTE) },
    });
    return;
  }

  let slots;
  try {
    slots = await getAvailability({
      authToken,
      resyVenueId: Number(w.restaurant.resyVenueId),
      day: w.targetDate.toISOString().slice(0, 10),
      partySize: w.partySize,
    });
  } catch (err) {
    if (err instanceof ResyError && err.code === "RATE_LIMITED") {
      resyCooldownUntil = now + 5 * MINUTE;
    }
    console.error(`Resy availability check failed for watch ${w.id}:`, err);
    await prisma.watch.update({
      where: { id: w.id },
      data: { lastCheckedAt: new Date(now), nextCheckAt: new Date(now + 5 * MINUTE) },
    });
    return;
  }

  const match = matchPreferredSlot(slots, w.preferredTimes);

  if (match) {
    await attemptAutoBook(w, match, authToken, now);
    return;
  }

  // No match on this check.
  if (w.status === WatchStatus.STRIKE_MODE) {
    await transition(
      w.id,
      w.userId,
      w.restaurant.name,
      WatchStatus.STRIKE_MODE,
      WatchStatus.ACTION_NEEDED,
      NotificationType.ACTION_NEEDED,
      "that open table is gone — we'll keep checking for another.",
      {
        matchedSlotToken: null,
        matchedSlotTime: null,
        lastCheckedAt: new Date(now),
        nextCheckAt: new Date(now + 2 * MINUTE),
      }
    );
    return;
  }

  if (w.status === WatchStatus.WATCHING && msToRelease <= 24 * 60 * MINUTE) {
    await transition(
      w.id,
      w.userId,
      w.restaurant.name,
      WatchStatus.WATCHING,
      WatchStatus.RELEASE_APPROACHING,
      NotificationType.RELEASE_APPROACHING,
      "checking Resy frequently as your estimated release time approaches.",
      { lastCheckedAt: new Date(now), nextCheckAt: new Date(now + 5 * MINUTE) }
    );
    return;
  }

  if (w.status === WatchStatus.RELEASE_APPROACHING && msToRelease < 0) {
    await transition(
      w.id,
      w.userId,
      w.restaurant.name,
      WatchStatus.RELEASE_APPROACHING,
      WatchStatus.ACTION_NEEDED,
      NotificationType.ACTION_NEEDED,
      "the estimated release time passed with no match yet — we'll keep checking.",
      { lastCheckedAt: new Date(now), nextCheckAt: new Date(now + 2 * MINUTE) }
    );
    return;
  }

  if (w.status === WatchStatus.ACTION_NEEDED && msToRelease < -30 * MINUTE) {
    await transition(
      w.id,
      w.userId,
      w.restaurant.name,
      WatchStatus.ACTION_NEEDED,
      WatchStatus.EXPIRED,
      NotificationType.EXPIRED,
      "this watch has expired without finding a match.",
      { lastCheckedAt: new Date(now) }
    );
    return;
  }

  const nextCheckDelay =
    w.status === WatchStatus.RELEASE_APPROACHING
      ? 5 * MINUTE
      : w.status === WatchStatus.ACTION_NEEDED
        ? 2 * MINUTE
        : 30 * MINUTE;

  await prisma.watch.update({
    where: { id: w.id },
    data: { lastCheckedAt: new Date(now), nextCheckAt: new Date(now + nextCheckDelay) },
  });
}

export async function transition(
  watchId: string,
  userId: string,
  restaurantName: string,
  fromStatus: WatchStatus,
  toStatus: WatchStatus,
  type: NotificationType,
  message: string,
  extraData: Record<string, unknown> = {}
) {
  // Conditional update guards against two overlapping tick runs (e.g. once
  // this moves to an externally-triggered cron) both observing the same
  // pre-transition status and double-firing the notification/push.
  const result = await prisma.watch.updateMany({
    where: { id: watchId, status: fromStatus },
    data: { status: toStatus, ...extraData },
  });
  if (result.count === 0) return;

  const notification = await prisma.notification.create({ data: { watchId, type, message } });

  if (PUSH_WORTHY.has(type)) {
    try {
      await sendPush(userId, {
        title: restaurantName,
        body: message,
        url: `/watches/${watchId}`,
      });
      await prisma.notification.update({
        where: { id: notification.id },
        data: { pushSentAt: new Date() },
      });
    } catch (err) {
      console.error("sendPush failed", err);
    }
  }
}
