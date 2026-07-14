import { Card } from "@/components/ui/Card";
import type { LucideIcon } from "lucide-react";

export function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
}) {
  return (
    <Card className="flex items-center gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-(--radius-md) bg-(--color-coral-soft) text-(--color-coral)">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div>
        <p className="text-2xl font-semibold text-(--color-text-primary)">{value}</p>
        <p className="text-sm text-(--color-text-secondary)">{label}</p>
      </div>
    </Card>
  );
}
