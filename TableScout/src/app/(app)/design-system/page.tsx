import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { RestaurantArt } from "@/components/RestaurantArt";
import { WatchStatus } from "@prisma/client";
import { Search, Zap, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-(--color-border) py-10 first:border-t-0 first:pt-0">
      <div className="mb-6">
        <h2 className="font-serif text-2xl text-(--color-text-primary)">{title}</h2>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-(--color-text-secondary)">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

const ALL_STATUSES = Object.values(WatchStatus);

export default function DesignSystemPage() {
  return (
    <div className="pb-16">
      <div className="mb-10">
        <span className="text-xs font-medium uppercase tracking-wide text-(--color-text-muted)">
          Internal reference
        </span>
        <h1 className="mt-2 font-serif text-4xl text-(--color-text-primary)">Design system</h1>
        <p className="mt-2 max-w-xl text-(--color-text-secondary)">
          A quick reference for every core visual pattern used across TableScout, kept in one
          place so new screens stay consistent.
        </p>
      </div>

      <Section title="Typography">
        <div className="space-y-4">
          <p className="font-serif text-5xl text-(--color-text-primary)">Never miss the table.</p>
          <p className="font-serif text-3xl italic text-(--color-text-primary)">
            Reservation released in 00:03
          </p>
          <p className="max-w-xl text-base text-(--color-text-primary)">
            Body copy uses the sans-serif interface font at a comfortable line height, kept to a
            short measure for readability.
          </p>
          <p className="text-sm text-(--color-text-secondary)">Secondary / supporting text</p>
          <p className="text-sm text-(--color-text-muted)">Muted / placeholder text</p>
          <p className="text-xs font-medium uppercase tracking-wide text-(--color-text-muted)">
            Small metadata label
          </p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Book now</Button>
          <Button variant="secondary">View details</Button>
          <Button variant="tertiary">Cancel watch</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="primary" size="lg">
            <Zap className="h-4 w-4" /> Strike mode CTA
          </Button>
        </div>
      </Section>

      <Section title="Inputs">
        <div className="grid max-w-md gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-(--color-text-primary)">
              Restaurant
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-text-muted)" />
              <input
                placeholder="Search restaurants"
                className="h-11 w-full rounded-(--radius-md) border border-(--color-border) bg-white pl-9 pr-3 text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:border-(--color-coral) focus:outline-none focus:ring-2 focus:ring-(--color-coral-soft)"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-(--color-text-primary)">
              Party size
            </span>
            <input
              type="number"
              defaultValue={2}
              className="h-11 w-full rounded-(--radius-md) border border-(--color-border) bg-white px-3 text-sm text-(--color-text-primary) focus:border-(--color-coral) focus:outline-none focus:ring-2 focus:ring-(--color-coral-soft)"
            />
            <span className="mt-1.5 block text-xs text-(--color-text-muted)">
              Most releases open for parties of 2–6.
            </span>
          </label>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="text-sm font-medium text-(--color-text-primary)">Standard card</p>
            <p className="mt-1 text-sm text-(--color-text-secondary)">
              White background, soft border, medium radius, low-contrast shadow.
            </p>
          </Card>
          <Card style={{ backgroundColor: "var(--color-neutral-soft)" }}>
            <p className="text-sm font-medium text-(--color-text-primary)">Alternate card</p>
            <p className="mt-1 text-sm text-(--color-text-secondary)">
              Pale neutral background for secondary emphasis.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="Status badges" description="Every status pairs a color with an icon and label.">
        <div className="flex flex-wrap gap-3">
          {ALL_STATUSES.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </Section>

      <Section title="Calendar states">
        <div className="grid w-fit grid-cols-7 gap-1.5">
          {Array.from({ length: 14 }).map((_, i) => {
            const selected = i === 9;
            const unavailable = i === 3 || i === 4;
            const today = i === 6;
            return (
              <div
                key={i}
                className={clsx(
                  "flex h-10 w-10 items-center justify-center rounded-(--radius-sm) text-sm",
                  selected && "bg-(--color-coral) font-semibold text-white",
                  unavailable && "text-(--color-text-muted) line-through",
                  !selected &&
                    !unavailable &&
                    "border border-(--color-border) bg-white text-(--color-text-primary)",
                  today && !selected && "border-(--color-coral) text-(--color-coral-hover)"
                )}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Navigation states">
        <div className="flex max-w-sm items-center gap-1 rounded-(--radius-lg) border border-(--color-border) bg-white p-1.5">
          <span className="rounded-(--radius-pill) bg-(--color-coral-soft) px-3 py-1.5 text-sm font-medium text-(--color-coral-hover)">
            Dashboard
          </span>
          <span className="rounded-(--radius-pill) px-3 py-1.5 text-sm font-medium text-(--color-text-secondary)">
            Design system
          </span>
        </div>
      </Section>

      <Section title="Notification cards">
        <div className="max-w-sm divide-y divide-(--color-border) rounded-(--radius-lg) border border-(--color-border) bg-white">
          <div className="flex gap-3 bg-(--color-coral-soft)/40 px-4 py-3">
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-(--color-coral)" />
            <p className="text-sm text-(--color-text-primary)">
              <span className="font-medium">Kōhaku</span> Strike Mode is live — book now.
            </p>
          </div>
          <div className="flex gap-3 px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-(--color-success)" />
            <p className="text-sm text-(--color-text-primary)">
              <span className="font-medium">Casa Verde</span> booked for 19:30.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Watch cards">
        <div className="grid gap-4 sm:grid-cols-2">
          {["Lumen", "Kōhaku"].map((name) => (
            <Card key={name} className="overflow-hidden p-0">
              <div className="h-28 w-full">
                <RestaurantArt seed={name} className="h-full w-full" />
              </div>
              <div className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-serif text-xl text-(--color-text-primary)">{name}</p>
                  <StatusBadge status={name === "Lumen" ? "RELEASE_APPROACHING" : "STRIKE_MODE"} />
                </div>
                <p className="text-sm text-(--color-text-secondary)">
                  Table for 2 · Sat, 7:00–8:00pm
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Countdown states">
        <div className="flex flex-wrap gap-6">
          <div className="rounded-(--radius-lg) border border-(--color-border) bg-white px-8 py-6 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-(--color-text-muted)">
              Releases in
            </p>
            <p className="mt-2 font-serif text-5xl text-(--color-text-primary)">04:12:33</p>
          </div>
          <div className="rounded-(--radius-lg) border border-(--color-coral) bg-(--color-coral-soft) px-8 py-6 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-(--color-coral-hover)">
              Strike mode
            </p>
            <p className="mt-2 animate-soft-pulse font-serif text-5xl text-(--color-coral)">
              00:03
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
