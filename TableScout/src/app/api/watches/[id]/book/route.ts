import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserOrResponse } from "@/lib/auth";
import { transition } from "@/lib/watchEngine";
import { getBookingToken, book as resyBook } from "@/lib/resy/client";
import { getDecryptedResyToken } from "@/lib/resy/userAuth";
import { ResyError } from "@/lib/resy/errors";
import { NotificationType, WatchStatus } from "@prisma/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserOrResponse();
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await params;

  const watch = await prisma.watch.findUnique({
    where: { id, userId: user.id },
    include: { restaurant: true },
  });
  if (!watch) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (watch.status !== WatchStatus.STRIKE_MODE && watch.status !== WatchStatus.ACTION_NEEDED) {
    return NextResponse.json(
      { error: "This watch is not currently bookable." },
      { status: 409 }
    );
  }

  const priorStatus = watch.status;
  const isRealResyBooking = Boolean(watch.restaurant.resyVenueId && watch.matchedSlotToken);

  await prisma.watch.update({ where: { id }, data: { status: WatchStatus.BOOKING } });

  if (!isRealResyBooking) {
    // Simulated fallback (no real Resy venue linked yet) — same demo
    // behavior as before, `tick()` finalizes this to BOOKED after ~3.5s.
    await prisma.notification.create({
      data: {
        watchId: id,
        type: NotificationType.INFO,
        message: "booking request sent — confirming your table now.",
      },
    });
    const updated = await prisma.watch.findUnique({
      where: { id },
      include: { restaurant: true, notifications: { orderBy: { createdAt: "desc" } } },
    });
    return NextResponse.json(updated);
  }

  // Real Resy booking, resolved synchronously within this request.
  try {
    const authToken = getDecryptedResyToken(user);
    const day = watch.targetDate.toISOString().slice(0, 10);

    const { bookToken, paymentType } = await getBookingToken({
      authToken,
      configToken: watch.matchedSlotToken!,
      day,
      partySize: watch.partySize,
    });

    if (paymentType !== "free") {
      throw new ResyError(
        "UNKNOWN",
        "This reservation requires a deposit — TableScout can't collect payment yet. Book it directly on Resy."
      );
    }

    const { reservationId } = await resyBook({ authToken, bookToken });

    await transition(
      id,
      user.id,
      watch.restaurant.name,
      WatchStatus.BOOKING,
      WatchStatus.BOOKED,
      NotificationType.BOOKED,
      `booked for ${watch.matchedSlotTime} — confirmation sent.`,
      { confirmedTime: watch.matchedSlotTime, resyReservationId: reservationId, lastBookingError: null }
    );
  } catch (err) {
    const message =
      err instanceof ResyError
        ? err.message
        : "Booking failed unexpectedly — the table may already be gone.";

    await prisma.watch.update({
      where: { id },
      data: { status: priorStatus, lastBookingError: message },
    });

    return NextResponse.json({ error: message, reason: "SLOT_TAKEN" }, { status: 409 });
  }

  const updated = await prisma.watch.findUnique({
    where: { id },
    include: { restaurant: true, notifications: { orderBy: { createdAt: "desc" } } },
  });
  return NextResponse.json(updated);
}
