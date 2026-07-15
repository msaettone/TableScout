"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Plus } from "lucide-react";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/NotificationBell";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/settings", label: "Settings" },
  { href: "/design-system", label: "Design system" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-(--color-border) bg-(--color-bg)/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-(--max-content-width) items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 sm:flex">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "rounded-(--radius-pill) px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-(--color-coral-soft) text-(--color-coral-hover)"
                      : "text-(--color-text-secondary) hover:text-(--color-text-primary)"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <Link
            href="/watches/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-(--radius-md) bg-(--color-coral) px-4 text-sm font-medium text-white transition-colors hover:bg-(--color-coral-hover)"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            <span className="hidden sm:inline">New watch</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
