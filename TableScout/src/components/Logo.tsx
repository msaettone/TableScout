import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 shrink-0">
      <span className="flex h-8 w-8 items-center justify-center rounded-(--radius-sm) bg-(--color-coral-soft) text-(--color-coral)">
        <UtensilsCrossed className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className="font-serif text-xl tracking-tight text-(--color-text-primary)">
        TableScout
      </span>
    </Link>
  );
}
