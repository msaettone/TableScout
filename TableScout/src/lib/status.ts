import type { WatchStatus } from "@prisma/client";
import {
  Bell,
  Clock,
  Zap,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  CircleSlash,
  type LucideIcon,
} from "lucide-react";

export type StatusMeta = {
  label: string;
  icon: LucideIcon;
  fg: string;
  bg: string;
  dot: string;
};

export const STATUS_META: Record<WatchStatus, StatusMeta> = {
  WATCHING: {
    label: "Notify activated",
    icon: Bell,
    fg: "var(--color-info)",
    bg: "var(--color-info-soft)",
    dot: "var(--color-info)",
  },
  RELEASE_APPROACHING: {
    label: "Release approaching",
    icon: Clock,
    fg: "var(--color-coral-hover)",
    bg: "var(--color-coral-soft)",
    dot: "var(--color-coral)",
  },
  STRIKE_MODE: {
    label: "Strike mode",
    icon: Zap,
    fg: "#ffffff",
    bg: "var(--color-coral)",
    dot: "#ffffff",
  },
  BOOKING: {
    label: "Booking in progress",
    icon: Loader2,
    fg: "var(--color-violet)",
    bg: "var(--color-violet-soft)",
    dot: "var(--color-violet)",
  },
  BOOKED: {
    label: "Booked",
    icon: CheckCircle2,
    fg: "var(--color-success-hover)",
    bg: "var(--color-success-soft)",
    dot: "var(--color-success)",
  },
  ACTION_NEEDED: {
    label: "Action needed",
    icon: AlertTriangle,
    fg: "#8a5a17",
    bg: "var(--color-warning-soft)",
    dot: "var(--color-warning)",
  },
  EXPIRED: {
    label: "Expired",
    icon: CircleSlash,
    fg: "var(--color-neutral-strong)",
    bg: "var(--color-neutral-soft)",
    dot: "var(--color-neutral)",
  },
};
