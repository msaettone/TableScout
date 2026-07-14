import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { RestaurantArt } from "@/components/RestaurantArt";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/Card";
import { formatTimeRange } from "@/lib/format";
import type { WatchWithRestaurant } from "@/lib/types";

const NEXT_ACTION: Record<string, string> = {
  WATCHING: "We'll notify you as the release approaches.",
  RELEASE_APPROACHING: "Get ready — the release window is coming up.",
  STRIKE_MODE: "The window is live. Enter Strike Mode to book.",
  BOOKING: "Confirming your table now…",
  BOOKED: "Your table is confirmed.",
  ACTION_NEEDED: "Availability may be open — check now.",
  EXPIRED: "This watch has expired.",
};

export function WatchCard({ watch }: { watch: WatchWithRestaurant }) {
  const times = watch.preferredTimes;

  return (
    <Link href={`/watches/${watch.id}`} className="block">
      <Card className="overflow-hidden p-0 transition-shadow hover:shadow-[var(--shadow-card-hover)]">
        <div className="h-28 w-full">
          <RestaurantArt seed={watch.restaurant.id} className="h-full w-full" />
        </div>
        <div className="p-5">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="font-serif text-xl text-(--color-text-primary)">
                {watch.restaurant.name}
              </p>
              <p className="text-xs text-(--color-text-muted)">
                {watch.restaurant.cuisine} · {watch.restaurant.neighborhood}
              </p>
            </div>
            <StatusBadge status={watch.status} />
          </div>

          <p className="text-sm text-(--color-text-secondary)">
            Table for {watch.partySize} · {format(new Date(watch.targetDate), "EEE, MMM d")}
            {watch.confirmedTime ? ` · ${watch.confirmedTime}` : times.length ? ` · ${formatTimeRange(times)}` : ""}
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-(--color-border) pt-3">
            <p className="text-sm text-(--color-text-primary)">{NEXT_ACTION[watch.status]}</p>
            <ArrowRight className="h-4 w-4 shrink-0 text-(--color-text-muted)" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
