"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RestaurantCombobox } from "@/components/RestaurantCombobox";
import type { Restaurant } from "@prisma/client";

const TIME_SLOTS = [
  "17:00", "17:30", "18:00", "18:30", "19:00",
  "19:30", "20:00", "20:30", "21:00", "21:30",
];

function todayPlusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function inMinutes(min: number) {
  const d = new Date(Date.now() + min * 60_000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewWatchPage() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [targetDate, setTargetDate] = useState(todayPlusDays(7));
  const [releaseAt, setReleaseAt] = useState(inMinutes(10));
  const [times, setTimes] = useState<string[]>(["19:00"]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleTime(t: string) {
    setTimes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].sort()
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!restaurant) {
      setError("Search for and choose a restaurant to watch.");
      return;
    }
    if (times.length === 0) {
      setError("Pick at least one preferred time.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/watches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: restaurant.id,
        partySize,
        preferredTimes: times,
        targetDate: new Date(targetDate).toISOString(),
        releaseAt: new Date(releaseAt).toISOString(),
      }),
    });

    if (!res.ok) {
      setSubmitting(false);
      setError("Something went wrong creating this watch. Try again.");
      return;
    }

    const watch = await res.json();
    router.push(`/watches/${watch.id}`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-serif text-4xl text-(--color-text-primary)">New watch</h1>
      <p className="mt-1 text-(--color-text-secondary)">
        Tell us what you&apos;re after and we&apos;ll watch for the release.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <Card>
          <span className="mb-1.5 block text-sm font-medium text-(--color-text-primary)">
            Restaurant
          </span>
          <RestaurantCombobox onSelect={setRestaurant} />
          <p className="mt-1.5 text-xs text-(--color-text-muted)">
            Searches Resy directly — requires your Resy account connected in Settings.
          </p>
        </Card>

        <Card className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-(--color-text-primary)">
                Party size
              </span>
              <input
                type="number"
                min={1}
                max={20}
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="h-11 w-full rounded-(--radius-md) border border-(--color-border) bg-white px-3 text-sm text-(--color-text-primary) focus:border-(--color-coral) focus:outline-none focus:ring-2 focus:ring-(--color-coral-soft)"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-(--color-text-primary)">
                Target date
              </span>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="h-11 w-full rounded-(--radius-md) border border-(--color-border) bg-white px-3 text-sm text-(--color-text-primary) focus:border-(--color-coral) focus:outline-none focus:ring-2 focus:ring-(--color-coral-soft)"
              />
            </label>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-(--color-text-primary)">
              Preferred times
            </span>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOTS.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => toggleTime(t)}
                  className={clsx(
                    "rounded-(--radius-pill) border px-3 py-1.5 text-sm font-medium transition-colors",
                    times.includes(t)
                      ? "border-(--color-coral) bg-(--color-coral-soft) text-(--color-coral-hover)"
                      : "border-(--color-border) bg-white text-(--color-text-secondary) hover:bg-(--color-bg-secondary)"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-(--color-text-muted)">
              We&apos;ll try to book the earliest match, in order.
            </p>
          </div>
        </Card>

        <Card>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-(--color-text-primary)">
              Your best guess for the release time
            </span>
            <input
              type="datetime-local"
              value={releaseAt}
              onChange={(e) => setReleaseAt(e.target.value)}
              className="h-11 w-full rounded-(--radius-md) border border-(--color-border) bg-white px-3 text-sm text-(--color-text-primary) focus:border-(--color-coral) focus:outline-none focus:ring-2 focus:ring-(--color-coral-soft)"
            />
            <span className="mt-1.5 block text-xs text-(--color-text-muted)">
              We poll Resy for real availability regardless — this just controls how often we
              check as the estimate approaches.
            </span>
          </label>
        </Card>

        {error && <p className="text-sm text-(--color-coral)">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create watch"}
          </Button>
        </div>
      </form>
    </div>
  );
}
