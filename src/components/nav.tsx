import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserButton } from "@clerk/nextjs";
import MobileNav from "./mobile-nav";

const playerLinks = [
  { href: "/feed", label: "Feed" },
  { href: "/friends", label: "Friends" },
  { href: "/courts", label: "Courts" },
  { href: "/coaches", label: "Coaches" },
  { href: "/events", label: "Events" },
  { href: "/shop", label: "Shop" },
  { href: "/scores", label: "Scores" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/messages", label: "Messages" },
  { href: "/notifications", label: "Notifications" },
];

export default async function Nav() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return null;

  const roleLinks = [
    ...(user.role === "COURT_MANAGER" || user.role === "ADMIN" ? [{ href: "/manage/courts", label: "My Courts", accent: true }] : []),
    ...(user.role === "EVENT_MANAGER" || user.role === "ADMIN" ? [{ href: "/manage/events", label: "My Events", accent: true }] : []),
    ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin", danger: true }] : []),
  ];

  const allLinks = [...playerLinks, ...roleLinks];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 dark:bg-gray-900/95 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="font-bold text-green-600 text-xl shrink-0 tracking-tight">PadelFlow</Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto flex-1 mx-4">
          {allLinks.map(l => (
            <Link key={l.href} href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                'danger' in l && l.danger ? "text-red-600 hover:bg-red-50" :
                'accent' in l && l.accent ? "text-green-600 hover:bg-green-50" :
                "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/settings" className="text-sm text-gray-500 hover:text-gray-700 hidden lg:block transition-colors">Settings</Link>
          <UserButton afterSignOutUrl="/" />
          {/* Mobile hamburger */}
          <MobileNav links={allLinks} />
        </div>
      </div>
    </header>
  );
}
