import clsx from "clsx";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "bg-white border border-(--color-border) rounded-(--radius-lg) p-6",
        "shadow-[var(--shadow-card)] transition-shadow duration-200",
        className
      )}
      {...props}
    />
  );
}
