export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { tick } = await import("@/lib/watchEngine");

  const run = () => {
    tick().catch((err) => console.error("watchEngine tick failed", err));
  };

  run();
  setInterval(run, 5000);
}
