# TableScout

Never miss a reservation release again. TableScout watches the restaurants you
care about and puts you first in line — including a "Strike Mode" countdown
for the moment a booking window opens.

## Running it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). That's it — the SQLite
database is created and seeded with sample restaurants and watches
automatically on first run (see `npm run dev`'s `predev` step), no separate
setup command needed.

To reset back to the original demo data at any point:

```bash
npm run db:seed
```

## What's here

- **Next.js (App Router) + TypeScript + Tailwind v4** for the app itself.
- **SQLite via Prisma** for storage — a single `prisma/dev.db` file, no
  external database to install or configure.
- A background engine (`src/instrumentation.ts` / `src/lib/watchEngine.ts`)
  ticks every few seconds and advances each watch through its lifecycle
  (watching → release approaching → Strike Mode → booked/expired) based on
  its release time, so the countdown and notification flows work live without
  a real restaurant-booking integration behind them.
- `/design-system` — an internal preview of every shared visual pattern
  (typography, buttons, inputs, cards, status badges, countdown states, etc).

## Notes

There's no real integration with restaurant booking platforms — release
times and availability are simulated so the product experience (watching,
alerts, Strike Mode, booking) can be demoed end-to-end.
