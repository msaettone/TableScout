"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Eye, Clock, CheckCircle2, ArrowRight, Plus } from "lucide-react";
import { WatchCard } from "@/components/WatchCard";
import { StatTile } from "@/components/StatTile";
import { StatusBadge } from "@/components/StatusBadge";
import { Countdown } from "@/components/Countdown";
import { RestaurantArt } from "@/components/RestaurantArt";
import { Card } from "@/components/ui/Card";
import { formatTimeRange } from "@/lib/format";
import type { WatchWithRestaurant } from "@/lib/types";

const TERMINAL = new Set(["BOOKED", "EXPIRED"]);

export default function DashboardPage() {
  const [watches, setWatches] = useState<WatchWithRestaurant[] | null>(null);

  async function load() {
    const res = await fetch("/api/watches");
    if (res.ok) setWatches(await res.json());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount + poll
    load();
    const interval = setInterval(load, 6000);
    return () => clearInterval(interval);
  }, []);

  if (!watches) {
    return <p className="text-sm text-(--color-text-muted)">Loading your watches…</p>;
  }

  const active = watches.filter((w) => !TERMINAL.has(w.status));
  const booked = watches.filter((w) => w.status === "BOOKED");
  const past = watches.filter((w) => TERMINAL.has(w.status));
  const hero = active[0];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-(--color-text-primary)">Dashboard</h1>
          <p className="mt-1 text-(--color-text-secondary)">
            Here&apos;s what&apos;s happening across your reservation watches.
          </p>
        </div>
        <Link
          href="/watches/new"
          className="hidden items-center gap-1.5 rounded-(--radius-md) bg-(--color-coral) px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-(--color-coral-hover) sm:inline-flex"
        >
          <Plus className="h-4 w-4" /> New watch
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Active watches" value={active.length} icon={Eye} />
        <StatTile label="Releases this week" value={active.length ? active.length : 0} icon={Clock} />
        <StatTile label="Booked" value={booked.length} icon={CheckCircle2} />
      </div>

      {hero && (
        <Card className="mb-10 overflow-hidden p-0">
          <div className="grid sm:grid-cols-[220px_1fr]">
            <div className="h-40 sm:h-full">
              <RestaurantArt seed={hero.restaurant.id} className="h-full w-full" />
            </div>
            <div className="p-6 sm:p-8">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-(--color-text-muted)">
                  Next reservation release
                </span>
                <StatusBadge status={hero.status} />
              </div>
              <h2 className="font-serif text-3xl text-(--color-text-primary)">
                {hero.restaurant.name}
              </h2>
              <p className="mt-1 text-sm text-(--color-text-secondary)">
                Table for {hero.partySize} · {format(new Date(hero.targetDate), "EEE, MMM d")} ·{" "}
                {formatTimeRange(hero.preferredTimes)}
              </p>

              <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-(--color-border) pt-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-(--color-text-muted)">
                    {hero.status === "STRIKE_MODE" || hero.status === "ACTION_NEEDED"
                      ? "Release opened"
                      : "Releases in"}
                  </p>
                  <Countdown
                    target={hero.releaseAt}
                    className="font-serif text-4xl text-(--color-text-primary)"
                  />
                </div>
                <Link
                  href={`/watches/${hero.id}`}
                  className="inline-flex h-11 items-center gap-1.5 rounded-(--radius-md) bg-(--color-coral) px-5 text-sm font-medium text-white transition-colors hover:bg-(--color-coral-hover)"
                >
                  {hero.status === "STRIKE_MODE" ? "Enter Strike Mode" : "View details"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      <section className="mb-10">
        <h3 className="mb-4 font-serif text-2xl text-(--color-text-primary)">Active watches</h3>
        {active.length === 0 ? (
          <Card className="text-center text-sm text-(--color-text-secondary)">
            No active watches yet.{" "}
            <Link href="/watches/new" className="font-medium text-(--color-coral)">
              Create your first watch
            </Link>
            .
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((w) => (
              <WatchCard key={w.id} watch={w} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h3 className="mb-4 font-serif text-2xl text-(--color-text-primary)">History</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((w) => (
              <WatchCard key={w.id} watch={w} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
