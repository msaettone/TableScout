"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onLogout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={onLogout}
      disabled={busy}
      className="inline-flex items-center gap-1.5 text-sm text-(--color-text-muted) hover:text-(--color-coral)"
    >
      <LogOut className="h-4 w-4" /> {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
