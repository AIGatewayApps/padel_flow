import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) redirect("/onboarding");

  const quickActions = [
    { href: "/courts", icon: "🎾", label: "Book a court", color: "bg-green-50 hover:bg-green-100 dark:bg-green-950/40 dark:hover:bg-green-900/40 border-green-200 dark:border-green-800" },
    { href: "/scores/new", icon: "📊", label: "Log score", color: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800" },
    { href: "/challenges", icon: "⚔️", label: "Challenge", color: "bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/40 border-orange-200 dark:border-orange-800" },
    { href: "/events", icon: "🏆", label: "Find events", color: "bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 border-purple-200 dark:border-purple-800" },
    { href: "/feed", icon: "📣", label: "Feed", color: "bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/40 dark:hover:bg-pink-900/40 border-pink-200 dark:border-pink-800" },
    { href: "/friends", icon: "👥", label: "Friends", color: "bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/40 dark:hover:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800" },
    { href: "/coaches", icon: "👨‍🏫", label: "Coaches", color: "bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 border-teal-200 dark:border-teal-800" },
    { href: "/leaderboard", icon: "🥇", label: "Leaderboard", color: "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 border-amber-200 dark:border-amber-800" },
    { href: "/shop", icon: "🛍️", label: "Shop", color: "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 border-rose-200 dark:border-rose-800" },
    { href: "/messages", icon: "💬", label: "Messages", color: "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800" },
    ...(user.role === "COURT_MANAGER" || user.role === "ADMIN"
      ? [{ href: "/court-manager-portal", icon: "🏟️", label: "Manage Courts", color: "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-700/40 border-slate-200 dark:border-slate-700" }]
      : []),
    ...(user.role === "EVENT_MANAGER" || user.role === "ADMIN"
      ? [{ href: "/event-manager-portal", icon: "📋", label: "Manage Events", color: "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-700/40 border-slate-200 dark:border-slate-700" }]
      : []),
    ...(user.role === "ADMIN"
      ? [{ href: "/admin", icon: "⚙️", label: "Admin panel", color: "bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 border-red-200 dark:border-red-800" }]
      : []),
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-sm text-[var(--color-text-muted)] mb-1">{greeting} 👋</p>
            <h1 className="text-3xl font-bold text-[var(--color-text)]">{user.displayName}</h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              @{user.username} ·
              <span className="ml-1 inline-flex items-center rounded-full bg-[var(--color-primary-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                {user.role.replace(/_/g, " ")}
              </span>
            </p>
          </div>
          <Link href="/settings" className="flex h-9 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
            ⚙️ Settings
          </Link>
        </div>

        {/* Quick actions */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Quick actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {quickActions.map(action => (
              <Link
                key={action.href}
                href={action.href}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${action.color}`}
              >
                <span className="text-2xl" role="img" aria-label={action.label}>{action.icon}</span>
                <span className="text-xs font-medium text-[var(--color-text)]">{action.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Two-col layout: recent bookings & activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent bookings */}
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-[var(--color-text)]">Recent bookings</h2>
              <Link href="/bookings" className="text-xs text-[var(--color-primary)] hover:underline">View all</Link>
            </div>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="text-4xl mb-3">🎾</span>
              <p className="text-sm text-[var(--color-text-muted)]">No bookings yet</p>
              <Link href="/courts" className="mt-3 text-xs font-medium text-[var(--color-primary)] hover:underline">Book your first court →</Link>
            </div>
          </section>

          {/* Match results */}
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-[var(--color-text)]">Recent matches</h2>
              <Link href="/scores" className="text-xs text-[var(--color-primary)] hover:underline">View all</Link>
            </div>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="text-4xl mb-3">📊</span>
              <p className="text-sm text-[var(--color-text-muted)]">No matches logged yet</p>
              <Link href="/scores/new" className="mt-3 text-xs font-medium text-[var(--color-primary)] hover:underline">Log your first result →</Link>
            </div>
          </section>
        </div>

        {/* Explore section */}
        <section className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-text)]">Explore PadelFlow</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/live" className="group flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 hover:border-[var(--color-primary)] transition-colors">
              <span className="text-xl">🔴</span>
              <div>
                <p className="text-sm font-medium text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">Live scores</p>
                <p className="text-xs text-[var(--color-text-muted)]">Follow matches live</p>
              </div>
            </Link>
            <Link href="/leaderboard" className="group flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 hover:border-[var(--color-primary)] transition-colors">
              <span className="text-xl">🏅</span>
              <div>
                <p className="text-sm font-medium text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">Leaderboard</p>
                <p className="text-xs text-[var(--color-text-muted)]">See who&apos;s on top</p>
              </div>
            </Link>
            <Link href="/ai-suggest" className="group flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 hover:border-[var(--color-primary)] transition-colors">
              <span className="text-xl">🤖</span>
              <div>
                <p className="text-sm font-medium text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">AI suggestions</p>
                <p className="text-xs text-[var(--color-text-muted)]">Improve your game</p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
