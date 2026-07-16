export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // In production this runs as serverless functions with no long-lived
  // process to hold a setInterval — an external cron hitting
  // /api/cron/tick takes over there instead. Local dev keeps the 5s
  // in-process convenience loop.
  if (process.env.NODE_ENV === "production") return;

  const { tick } = await import("@/lib/watchEngine");

  const run = () => {
    tick().catch((err) => console.error("watchEngine tick failed", err));
  };

  run();
  setInterval(run, 5000);
}
