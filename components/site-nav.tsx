"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "index" },
  { href: "/crypto", label: "crypto" },
  { href: "/cloud", label: "cloud" },
  { href: "/isms", label: "isms" },
  { href: "/team", label: "team" },
] as const;

export default function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
        <Link href="/" className="mono flex items-center gap-2 text-sm">
          <span className="text-accent">~/</span>
          <span className="font-semibold tracking-tight">aegiscloud</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-0.5 md:flex">
          {items.map((it) => {
            const active =
              it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`mono rounded-sm px-2.5 py-1.5 text-xs transition-colors ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {active ? "› " : ""}
                {it.label}
              </Link>
            );
          })}
        </nav>

      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-line-soft px-4 py-1.5 md:hidden">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`mono whitespace-nowrap px-2 py-1 text-[11px] ${
              pathname === it.href ? "text-accent" : "text-muted"
            }`}
          >
            {it.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
