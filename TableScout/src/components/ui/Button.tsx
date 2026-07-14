import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "tertiary";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

const variants: Record<Variant, string> = {
  primary:
    "bg-(--color-coral) text-white hover:bg-(--color-coral-hover) rounded-(--radius-md) focus-visible:ring-(--color-coral)",
  secondary:
    "bg-white text-(--color-text-primary) border border-(--color-border) hover:bg-(--color-bg-secondary) rounded-(--radius-md) focus-visible:ring-(--color-coral)",
  tertiary:
    "bg-transparent text-(--color-text-secondary) hover:text-(--color-text-primary) rounded-(--radius-sm) focus-visible:ring-(--color-coral)",
};

const sizes: Record<Size, string> = {
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(({ className, variant = "primary", size = "md", ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});

Button.displayName = "Button";
