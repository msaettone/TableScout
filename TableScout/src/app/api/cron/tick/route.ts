import { NextRequest, NextResponse } from "next/server";
import { tick } from "@/lib/watchEngine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Called by an external cron (cron-job.org) roughly once a minute in
// production, where there's no long-lived process to hold the in-process
// setInterval that local dev uses instead (see src/instrumentation.ts).
// Capped at 20 watches per call to stay inside a serverless function's
// timeout — tick() processes oldest-due-first, so leftovers get picked up
// on the next invocation a minute later.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await tick(20);

  return NextResponse.json({ ok: true });
}
