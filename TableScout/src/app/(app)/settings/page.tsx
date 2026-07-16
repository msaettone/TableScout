import { getCurrentUser } from "@/lib/auth";
import { PushOptIn } from "@/components/PushOptIn";
import { LogoutButton } from "@/components/LogoutButton";
import { ResyConnect } from "@/components/ResyConnect";
import { Card } from "@/components/ui/Card";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-serif text-4xl text-(--color-text-primary)">Settings</h1>
      <p className="mt-1 text-(--color-text-secondary)">
        Manage how TableScout alerts you and connects to your accounts.
      </p>

      <div className="mt-8 space-y-4">
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-(--color-text-primary)">Signed in as</p>
            <p className="mt-1 text-sm text-(--color-text-secondary)">{user?.email}</p>
          </div>
          <LogoutButton />
        </Card>

        <ResyConnect connectedAt={user?.resyTokenUpdatedAt?.toISOString() ?? null} />
        <p className="px-1 text-xs text-(--color-text-muted)">
          Connecting uses your personal Resy session to check availability and book on your
          behalf. This isn&apos;t an official Resy integration and is against their terms of
          service — the risk is limited to your own Resy account, not shared with anyone else&apos;s.
        </p>

        <PushOptIn />
      </div>
    </div>
  );
}
