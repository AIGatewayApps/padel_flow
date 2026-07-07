import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true, courtManager: true, eventManager: true },
  });
  if (!user) redirect("/onboarding");

  const navItems: { href: string; label: string }[] = [
    { href: "/feed", label: "Feed" },
    { href: "/friends", label: "Friends" },
    { href: "/courts", label: "Courts" },
    { href: "/scores", label: "Scores" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/coaches", label: "Coaches" },
    { href: "/events", label: "Events" },
    { href: "/shop", label: "Shop" },
    { href: "/messages", label: "Messages" },
    { href: "/settings", label: "Settings" },
    ...(user.role === "COURT_MANAGER" || user.role === "ADMIN" ? [{ href: "/manage/courts", label: "Manage Courts" }] : []),
    ...(user.role === "EVENT_MANAGER" || user.role === "ADMIN" ? [{ href: "/manage/events", label: "Manage Events" }] : []),
    ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Welcome, {user.displayName}</h1>
      <p className="text-gray-500 mb-8">@{user.username} · {user.role}</p>
      <nav className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {navItems.map(item => (
          <Link key={item.href} href={item.href}
            className="border rounded-xl p-4 font-medium hover:bg-green-50 hover:border-green-400 transition text-center">
            {item.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
