"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Home", icon: "⊞" },
  { href: "/courts",    label: "Courts", icon: "🎾" },
  { href: "/feed",      label: "Feed", icon: "📣" },
  { href: "/scores",   label: "Scores", icon: "📊" },
  { href: "/messages", label: "Chat", icon: "💬" },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map(tab => {
          const active = pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-center transition-colors ${
                active ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-xl leading-none" role="img" aria-hidden>{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {active && <span className="h-0.5 w-4 rounded-full bg-[var(--color-primary)] mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
