"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/feed", label: "Feed", icon: "📣" },
  { href: "/courts", label: "Courts", icon: "🎾" },
  { href: "/scores", label: "Scores", icon: "📊" },
  { href: "/events", label: "Events", icon: "🏆" },
  { href: "/friends", label: "Friends", icon: "👥" },
  { href: "/coaches", label: "Coaches", icon: "👨‍🏫" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏅" },
  { href: "/shop", label: "Shop", icon: "🛍️" },
  { href: "/messages", label: "Messages", icon: "💬" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] min-h-screen sticky top-0 h-screen overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-[var(--color-border)]">
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-label="PadelFlow" className="text-[var(--color-primary)] shrink-0">
          <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="2.5"/>
          <path d="M8 14 Q14 8 20 14 Q14 20 8 14Z" fill="currentColor" opacity="0.9"/>
          <circle cx="14" cy="14" r="2.5" fill="white"/>
        </svg>
        <span className="font-bold text-sm text-[var(--color-text)]">PadelFlow</span>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {navLinks.map(link => {
          const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
              }`}
            >
              <span className="text-base" role="img" aria-hidden>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: settings + user */}
      <div className="border-t border-[var(--color-border)] p-3 flex flex-col gap-1">
        <Link
          href="/settings"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname.startsWith("/settings")
              ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
              : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
          }`}
        >
          <span className="text-base" role="img" aria-hidden>⚙️</span>
          Settings
        </Link>
        <div className="flex items-center gap-3 px-3 py-2">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </aside>
  );
}
