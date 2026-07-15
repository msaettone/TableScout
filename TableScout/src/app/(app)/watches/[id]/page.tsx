"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  Zap,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ArrowLeft,
  Info,
  Clock,
  CircleSlash,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { Countdown } from "@/components/Countdown";
import { RestaurantArt } from "@/components/RestaurantArt";
import type { WatchStatus } from "@prisma/client";

type NotificationItem = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

type WatchDetail = {
  id: string;
  restaurant: {
    id: string;
    name: string;
    cuisine: string;
    neighborhood: string;
    priceRange: string;
    resyVenueId: string | null;
  };
  targetDate: string;
  partySize: number;
  preferredTimes: string[];
  releaseAt: string;
  status: string;
  confirmedTime: string | null;
  matchedSlotTime: string | null;
  lastBookingError: string | null;
  notifications: NotificationItem[];
};

const TIMELINE_ICONS: Record<string, typeof Info> = {
  INFO: Info,
  RELEASE_APPROACHING: Clock,
  STRIKE_MODE: Zap,
  BOOKED: CheckCircle2,
  ACTION_NEEDED: AlertTriangle,
  EXPIRED: CircleSlash,
};

export default function WatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [watch, setWatch] = useState<WatchDetail | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/watches/${id}`);
    if (res.ok) setWatch(await res.json());
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount + poll
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [load]);

  async function onBook() {
    setBooking(true);
    setBookError("");
    const res = await fetch(`/api/watches/${id}/book`, { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setBookError(body.error ?? "Booking failed — someone may have beaten you to it.");
    }
    await load();
    setBooking(false);
  }

  async function onCancel() {
    if (!confirm("Cancel this watch? This can't be undone.")) return;
    await fetch(`/api/watches/${id}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  if (!watch) {
    return <p className="text-sm text-(--color-text-muted)">Loading watch…</p>;
  }

  const times = watch.preferredTimes;
  const isStrike = watch.status === "STRIKE_MODE";
  const isActionNeeded = watch.status === "ACTION_NEEDED";
  const isBooking = watch.status === "BOOKING";
  const isBooked = watch.status === "BOOKED";
  const isExpired = watch.status === "EXPIRED";

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-(--color-text-secondary) hover:text-(--color-text-primary)"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <Card className="mb-6 overflow-hidden p-0">
        <div className="h-36 w-full">
          <RestaurantArt seed={watch.restaurant.id} className="h-full w-full" />
        </div>
        <div className="p-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-serif text-3xl text-(--color-text-primary)">
              {watch.restaurant.name}
            </h1>
            <StatusBadge status={watch.status as WatchStatus} />
          </div>
          <p className="text-sm text-(--color-text-secondary)">
            {watch.restaurant.cuisine} · {watch.restaurant.neighborhood} · {watch.restaurant.priceRange}
          </p>
          <p className="mt-3 text-sm text-(--color-text-primary)">
            Table for {watch.partySize} · {format(new Date(watch.targetDate), "EEE, MMM d")} ·{" "}
            {isBooked && watch.confirmedTime ? watch.confirmedTime : times.join(", ")}
          </p>
        </div>
      </Card>

      {/* Strike / action state */}
      {(isStrike || isActionNeeded) && (
        <div
          className="mb-6 rounded-(--radius-lg) border p-6 text-center shadow-[var(--shadow-card)]"
          style={{
            borderColor: isStrike ? "var(--color-coral)" : "var(--color-warning)",
            backgroundColor: isStrike ? "var(--color-coral-soft)" : "var(--color-warning-soft)",
          }}
        >
          <p
            className="text-xs font-medium uppercase tracking-wide"
            style={{ color: isStrike ? "var(--color-coral-hover)" : "#8a5a17" }}
          >
            {isStrike ? "Strike mode is live" : "Action needed"}
          </p>
          <Countdown
            target={watch.releaseAt}
            className={`mt-2 block font-serif text-6xl ${isStrike ? "animate-soft-pulse text-(--color-coral)" : "text-(--color-text-primary)"}`}
          />
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            {watch.restaurant.resyVenueId
              ? isStrike
                ? `A table opened${watch.matchedSlotTime ? ` at ${watch.matchedSlotTime}` : ""} but needs a deposit — we can't charge you automatically, so tap below or book it directly on Resy.`
                : "Our estimate passed with nothing found yet — we're still checking, or try booking directly."
              : isStrike
                ? "The booking window is opening now. Tap below to claim your table."
                : "The release window opened. Confirm now before it's gone."}
          </p>
          {bookError && (
            <p className="mt-2 text-sm font-medium text-(--color-coral-hover)">{bookError}</p>
          )}
          <Button
            onClick={onBook}
            disabled={booking}
            size="lg"
            className="mt-5 w-full sm:w-auto"
          >
            {booking ? "Sending request…" : "Book now"}
          </Button>
        </div>
      )}

      {isBooking && (
        <div
          className="mb-6 rounded-(--radius-lg) border p-6 text-center shadow-[var(--shadow-card)]"
          style={{ borderColor: "var(--color-violet)", backgroundColor: "var(--color-violet-soft)" }}
        >
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-(--color-violet)" />
          <p className="mt-3 text-sm font-medium text-(--color-text-primary)">
            Confirming your table…
          </p>
          <p className="mt-1 text-sm text-(--color-text-secondary)">
            This usually takes just a few seconds.
          </p>
        </div>
      )}

      {isBooked && (
        <div
          className="mb-6 rounded-(--radius-lg) border p-6 text-center shadow-[var(--shadow-card)]"
          style={{ borderColor: "var(--color-success)", backgroundColor: "var(--color-success-soft)" }}
        >
          <CheckCircle2 className="mx-auto h-8 w-8 text-(--color-success)" />
          <p className="mt-3 font-serif text-2xl text-(--color-text-primary)">
            Table confirmed for {watch.confirmedTime}
          </p>
          <p className="mt-1 text-sm text-(--color-text-secondary)">
            A confirmation has been sent — enjoy your meal.
          </p>
        </div>
      )}

      {isExpired && (
        <div
          className="mb-6 rounded-(--radius-lg) border border-(--color-border) p-6 text-center shadow-[var(--shadow-card)]"
          style={{ backgroundColor: "var(--color-neutral-soft)" }}
        >
          <CircleSlash className="mx-auto h-8 w-8 text-(--color-neutral-strong)" />
          <p className="mt-3 text-sm font-medium text-(--color-text-primary)">
            This watch expired without a confirmed booking.
          </p>
        </div>
      )}

      {(watch.status === "WATCHING" || watch.status === "RELEASE_APPROACHING") && (
        <Card className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-(--color-text-muted)">
            Releases in
          </p>
          <Countdown
            target={watch.releaseAt}
            className="mt-2 block font-serif text-5xl text-(--color-text-primary)"
          />
          <p className="mt-2 text-sm text-(--color-text-secondary)">
            We&apos;ll switch to Strike Mode automatically as the window opens.
          </p>
        </Card>
      )}

      <Card>
        <h2 className="mb-4 text-sm font-medium text-(--color-text-primary)">Activity</h2>
        <div className="space-y-4">
          {watch.notifications.map((n) => {
            const Icon = TIMELINE_ICONS[n.type] ?? Info;
            return (
              <div key={n.id} className="flex gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-(--color-coral)" />
                <div>
                  <p className="text-sm text-(--color-text-primary)">{n.message}</p>
                  <p className="text-xs text-(--color-text-muted)">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {!isBooked && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-sm text-(--color-text-muted) hover:text-(--color-coral)"
          >
            <Trash2 className="h-4 w-4" /> Cancel this watch
          </button>
        </div>
      )}
    </div>
  );
}
