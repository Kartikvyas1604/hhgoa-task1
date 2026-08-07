"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [{ href: "/", label: "Frame Generator" }];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-void/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-baseline gap-2 font-mono text-xs tracking-tight sm:text-sm"
          aria-label="FrameInGoa home"
        >
          <span className="font-display text-base font-bold tracking-tight text-ink transition-colors duration-150 group-hover:text-sunset sm:text-lg">
            FrameInGoa
          </span>
          <span className="hidden text-muted md:inline">
            HH GOA 2026
          </span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-sm px-2.5 py-2 font-mono text-[11px] tracking-tight transition-colors duration-150 sm:px-3 sm:text-xs ${
                  active
                    ? "text-sunset"
                    : "text-muted hover:text-ink"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {active ? "▸ " : ""}
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
