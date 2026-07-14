"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Zap, Clock, CheckCircle2, AlertTriangle, CircleSlash, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";

type NotificationItem = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  watch: { id: string; restaurant: { name: string } };
};

const ICONS: Record<string, typeof Bell> = {
  INFO: Info,
  RELEASE_APPROACHING: Clock,
  STRIKE_MODE: Zap,
  BOOKED: CheckCircle2,
  ACTION_NEEDED: AlertTriangle,
  EXPIRED: CircleSlash,
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter((i) => !i.read).length;

  async function load() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setItems(await res.json());
    } catch {
      // ignore transient fetch errors
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount + poll
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAllRead() {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    await fetch("/api/notifications/read-all", { method: "POST" });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
        }}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-(--radius-md) text-(--color-text-secondary) transition-colors hover:bg-(--color-bg-secondary) hover:text-(--color-text-primary)"
      >
        <Bell className="h-5 w-5" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-(--color-coral)" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-(--radius-lg) border border-(--color-border) bg-white shadow-[var(--shadow-card-hover)]">
          <div className="flex items-center justify-between border-b border-(--color-border) px-4 py-3">
            <span className="text-sm font-medium text-(--color-text-primary)">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium text-(--color-coral) hover:text-(--color-coral-hover)"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-(--color-text-muted)">
                No notifications yet.
              </p>
            )}
            {items.map((item) => {
              const Icon = ICONS[item.type] ?? Info;
              return (
                <div
                  key={item.id}
                  className={clsx(
                    "flex gap-3 border-b border-(--color-border) px-4 py-3 last:border-b-0",
                    !item.read && "bg-(--color-coral-soft)/40"
                  )}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-(--color-coral)" strokeWidth={2} />
                  <div className="min-w-0">
                    <p className="text-sm text-(--color-text-primary)">
                      <span className="font-medium">{item.watch.restaurant.name}</span>{" "}
                      {item.message}
                    </p>
                    <p className="mt-0.5 text-xs text-(--color-text-muted)">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
