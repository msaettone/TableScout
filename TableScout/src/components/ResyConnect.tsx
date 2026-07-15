"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { UtensilsCrossed, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function ResyConnect({ connectedAt }: { connectedAt: string | null }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onConnect(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/settings/resy-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Couldn't save that token.");
      }
      setToken("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that token.");
    } finally {
      setBusy(false);
    }
  }

  async function onDisconnect() {
    setBusy(true);
    await fetch("/api/settings/resy-token", { method: "DELETE" });
    router.refresh();
    setBusy(false);
  }

  return (
    <Card>
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-(--radius-md) bg-(--color-coral-soft) text-(--color-coral)">
          <UtensilsCrossed className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-(--color-text-primary)">Resy account</p>

          {connectedAt ? (
            <>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-(--color-success-hover)">
                <Check className="h-4 w-4" /> Connected{" "}
                {formatDistanceToNow(new Date(connectedAt), { addSuffix: true })}
              </p>
              <p className="mt-2 text-xs text-(--color-text-muted)">
                Bookings made through TableScout use this account. Reconnect below if Resy signs
                you out.
              </p>
              <button
                onClick={onDisconnect}
                disabled={busy}
                className="mt-3 text-sm text-(--color-text-muted) hover:text-(--color-coral)"
              >
                Disconnect
              </button>
            </>
          ) : (
            <p className="mt-1 text-sm text-(--color-text-secondary)">
              Connect your Resy account so TableScout can check real availability and book on
              your behalf.
            </p>
          )}

          <form onSubmit={onConnect} className="mt-3 space-y-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-(--color-text-primary)">
                Resy auth token
              </span>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your x-resy-auth-token"
                className="h-10 w-full rounded-(--radius-md) border border-(--color-border) bg-white px-3 text-sm text-(--color-text-primary) focus:border-(--color-coral) focus:outline-none focus:ring-2 focus:ring-(--color-coral-soft)"
              />
              <span className="mt-1.5 block text-xs text-(--color-text-muted)">
                resy.com, logged in → browser DevTools → Network → any api.resy.com request →
                copy the <code>x-resy-auth-token</code> header.
              </span>
            </label>
            {error && <p className="text-sm text-(--color-coral)">{error}</p>}
            <Button type="submit" variant="secondary" size="md" disabled={busy || !token}>
              {busy ? "Saving…" : connectedAt ? "Update token" : "Connect Resy"}
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}
