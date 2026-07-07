import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserButton } from "@clerk/nextjs";

export default async function Nav() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const links = [
    { href: "/feed", label: "Feed" },
    { href: "/friends", label: "Friends" },
    { href: "/courts", label: "Courts" },
    { href: "/coaches", label: "Coaches" },
    { href: "/events", label: "Events" },
    { href: "/shop", label: "Shop" },
    { href: "/scores", label: "Scores" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/messages", label: "Messages" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="font-bold text-green-600 text-lg shrink-0">PadelFlow</Link>
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 whitespace-nowrap transition">
              {l.label}
            </Link>
          ))}
          {(user.role === "COURT_MANAGER" || user.role === "ADMIN") && (
            <Link href="/manage/courts" className="px-3 py-1.5 rounded-lg text-sm font-medium text-green-600 hover:bg-green-50 transition">My Courts</Link>
          )}
          {(user.role === "EVENT_MANAGER" || user.role === "ADMIN") && (
            <Link href="/manage/events" className="px-3 py-1.5 rounded-lg text-sm font-medium text-green-600 hover:bg-green-50 transition">My Events</Link>
          )}
          {user.role === "ADMIN" && (
            <Link href="/admin" className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition">Admin</Link>
          )}
        </nav>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/settings" className="text-sm text-gray-500 hover:text-gray-700 hidden md:block">Settings</Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
