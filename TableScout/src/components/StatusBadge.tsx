import type { WatchStatus } from "@prisma/client";
import { STATUS_META } from "@/lib/status";

export function StatusBadge({ status }: { status: WatchStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  const pulse = status === "STRIKE_MODE";

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ color: meta.fg, backgroundColor: meta.bg }}
    >
      <Icon className={`h-3.5 w-3.5 ${pulse ? "animate-soft-pulse" : ""}`} strokeWidth={2.25} />
      {meta.label}
    </span>
  );
}
