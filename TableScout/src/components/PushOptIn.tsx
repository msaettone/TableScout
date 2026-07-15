"use client";

import { useEffect, useState } from "react";
import { BellRing, Smartphone, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(ua);
  const isStandalone =
    "standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone;
  return isIos && !isStandalone;
}

type Status = "checking" | "unsupported" | "ios-needs-install" | "denied" | "subscribed" | "ready";

export function PushOptIn() {
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function check() {
      if (isIosSafari()) return setStatus("ios-needs-install");
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return setStatus("unsupported");
      }
      if (Notification.permission === "denied") return setStatus("denied");

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? "subscribed" : "ready");
    }
    check();
  }, []);

  async function subscribe() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      setStatus("subscribed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-(--radius-md) bg-(--color-coral-soft) text-(--color-coral)">
          <BellRing className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-(--color-text-primary)">Push notifications</p>

          {status === "checking" && (
            <p className="mt-1 text-sm text-(--color-text-secondary)">Checking status…</p>
          )}

          {status === "ios-needs-install" && (
            <div className="mt-1">
              <p className="text-sm text-(--color-text-secondary)">
                On iPhone, notifications only work once TableScout is added to your Home Screen.
              </p>
              <div className="mt-2 flex items-center gap-2 rounded-(--radius-md) bg-(--color-info-soft) px-3 py-2 text-sm text-(--color-text-primary)">
                <Smartphone className="h-4 w-4 shrink-0 text-(--color-info)" />
                Tap the Share icon, then &ldquo;Add to Home Screen&rdquo; — then open TableScout
                from your Home Screen and come back to this page.
              </div>
            </div>
          )}

          {status === "unsupported" && (
            <p className="mt-1 text-sm text-(--color-text-secondary)">
              Your browser doesn&apos;t support push notifications. You&apos;ll still see alerts
              in the notification bell whenever the app is open.
            </p>
          )}

          {status === "denied" && (
            <p className="mt-1 text-sm text-(--color-text-secondary)">
              Notifications are blocked for this site. Enable them in your browser&apos;s site
              settings to get real-time alerts.
            </p>
          )}

          {status === "ready" && (
            <>
              <p className="mt-1 text-sm text-(--color-text-secondary)">
                Get notified the instant a watch changes status, even when TableScout isn&apos;t
                open.
              </p>
              <Button
                onClick={subscribe}
                disabled={busy}
                variant="secondary"
                size="md"
                className="mt-3"
              >
                {busy ? "Enabling…" : "Enable notifications"}
              </Button>
            </>
          )}

          {status === "subscribed" && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-(--color-success-hover)">
              <Check className="h-4 w-4" /> Notifications enabled on this device.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
