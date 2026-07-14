import Link from "next/link";
import { Bell, Zap, CalendarCheck, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { RestaurantArt } from "@/components/RestaurantArt";
import { Card } from "@/components/ui/Card";

const FEATURES = [
  {
    icon: Bell,
    title: "Set a watch",
    body: "Tell us the restaurant, party size, and preferred times. We track the exact moment reservations open.",
  },
  {
    icon: Zap,
    title: "Get alerted instantly",
    body: "Strike Mode kicks in right before the release window — no refreshing, no guesswork.",
  },
  {
    icon: CalendarCheck,
    title: "Book before anyone else",
    body: "One tap to confirm your table the second availability opens, from your phone or laptop.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-(--color-border)">
        <div className="mx-auto flex h-16 max-w-(--max-content-width) items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center rounded-(--radius-md) bg-(--color-coral) px-4 text-sm font-medium text-white transition-colors hover:bg-(--color-coral-hover)"
          >
            Open dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-(--max-content-width) px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="mb-4 inline-block rounded-(--radius-pill) bg-(--color-coral-soft) px-3 py-1 text-xs font-medium uppercase tracking-wide text-(--color-coral-hover)">
                Reservation watching
              </span>
              <h1 className="font-serif text-5xl leading-[1.05] text-(--color-text-primary) sm:text-6xl">
                Never miss the table again.
              </h1>
              <p className="mt-5 max-w-md text-lg text-(--color-text-secondary)">
                TableScout watches the restaurants you love and puts you first in line the instant
                new reservations open.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center gap-2 rounded-(--radius-md) bg-(--color-coral) px-6 text-base font-medium text-white transition-colors hover:bg-(--color-coral-hover)"
                >
                  Start watching <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/design-system"
                  className="inline-flex h-12 items-center rounded-(--radius-md) border border-(--color-border) bg-white px-6 text-base font-medium text-(--color-text-primary) transition-colors hover:bg-(--color-bg-secondary)"
                >
                  See how it looks
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <RestaurantArt seed="hero-1" className="h-40 w-full rounded-(--radius-lg) sm:h-52" />
              <RestaurantArt seed="hero-2" className="mt-8 h-40 w-full rounded-(--radius-lg) sm:h-52" />
              <RestaurantArt seed="hero-3" className="h-40 w-full rounded-(--radius-lg) sm:h-52" />
              <RestaurantArt seed="hero-4" className="mt-8 h-40 w-full rounded-(--radius-lg) sm:h-52" />
            </div>
          </div>
        </section>

        <section className="border-t border-(--color-border) bg-(--color-bg-secondary) py-16 sm:py-20">
          <div className="mx-auto max-w-(--max-content-width) px-4 sm:px-6">
            <h2 className="font-serif text-3xl text-(--color-text-primary)">How it works</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {FEATURES.map((f) => (
                <Card key={f.title}>
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-(--radius-md) bg-(--color-coral-soft) text-(--color-coral)">
                    <f.icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <h3 className="text-lg font-medium text-(--color-text-primary)">{f.title}</h3>
                  <p className="mt-2 text-sm text-(--color-text-secondary)">{f.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-(--color-border) py-8">
        <div className="mx-auto flex max-w-(--max-content-width) items-center justify-between px-4 text-sm text-(--color-text-muted) sm:px-6">
          <span>TableScout</span>
          <span>Built for people who plan ahead.</span>
        </div>
      </footer>
    </div>
  );
}
