import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="PadelFlow logo" className="text-[var(--color-primary)]">
              <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="2.5"/>
              <path d="M8 14 Q14 8 20 14 Q14 20 8 14Z" fill="currentColor" opacity="0.9"/>
              <circle cx="14" cy="14" r="2.5" fill="white"/>
            </svg>
            <span className="font-bold tracking-tight text-[var(--color-text)]">PadelFlow</span>
          </div>
          <nav className="hidden gap-6 text-sm text-[var(--color-text-muted)] sm:flex">
            <Link href="/courts" className="hover:text-[var(--color-text)] transition-colors">Courts</Link>
            <Link href="/events" className="hover:text-[var(--color-text)] transition-colors">Events</Link>
            <Link href="/coaches" className="hover:text-[var(--color-text)] transition-colors">Coaches</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">Sign in</Link>
            <Link href="/sign-up" className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-block rounded-full border border-[var(--color-primary-subtle)] bg-[var(--color-primary-subtle)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)] mb-6">
            The padel platform you&apos;ve been waiting for
          </span>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
            Play more.
            <span className="text-[var(--color-primary)]"> Connect</span>,
            <span className="text-[var(--color-primary)]"> compete</span>,
            <span className="text-[var(--color-primary)]"> grow.</span>
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-xl mx-auto mb-10">
            Book courts in seconds, track your scores, challenge friends, find coaches, and join the fastest-growing padel community.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up" className="rounded-xl bg-[var(--color-primary)] px-8 py-3.5 text-base font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-[var(--shadow-md)]">
              Start for free
            </Link>
            <Link href="/courts" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-3.5 text-base font-semibold hover:bg-[var(--color-surface-2)] transition-colors">
              Browse courts
            </Link>
          </div>
          <p className="mt-4 text-xs text-[var(--color-text-faint)]">Free forever · No credit card required</p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)] py-8 px-4">
        <div className="mx-auto max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: "12k+", label: "Active players" },
            { value: "340+", label: "Courts listed" },
            { value: "98%", label: "Booking success" },
            { value: "4.9★", label: "App rating" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-[var(--color-text)]">{s.value}</p>
              <p className="text-sm text-[var(--color-text-muted)]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-3">Everything padel, in one place</h2>
          <p className="text-center text-[var(--color-text-muted)] mb-12">From your first booking to the winner&apos;s podium.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "🎾", title: "Court booking", desc: "Find and book padel courts near you in seconds. Real-time availability, instant confirmation." },
              { icon: "📊", title: "Score tracking", desc: "Log every match result, track your win rate, and watch your ranking climb." },
              { icon: "🏆", title: "Tournaments & events", desc: "Join local tournaments or create your own. Full bracket management included." },
              { icon: "👥", title: "Social feed", desc: "Share match results, follow friends, and celebrate victories together." },
              { icon: "🤝", title: "Find players", desc: "Challenge players at your level. Filter by skill, location, and availability." },
              { icon: "👨‍🏫", title: "Book a coach", desc: "Connect with certified padel coaches for private or group sessions." },
            ].map(f => (
              <div key={f.title} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 hover:shadow-[var(--shadow-md)] transition-shadow">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-[var(--color-text)] mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-[var(--color-primary)] text-white text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-3xl font-bold mb-4">Ready to elevate your game?</h2>
          <p className="text-green-100 mb-8">Join thousands of players already using PadelFlow to book, compete, and connect.</p>
          <Link href="/sign-up" className="inline-block rounded-xl bg-white text-[var(--color-primary)] px-8 py-3.5 font-semibold hover:bg-green-50 transition-colors">
            Create free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8 px-4">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--color-text-muted)]">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none" className="text-[var(--color-primary)]">
              <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="2.5"/>
              <path d="M8 14 Q14 8 20 14 Q14 20 8 14Z" fill="currentColor" opacity="0.9"/>
              <circle cx="14" cy="14" r="2.5" fill="white"/>
            </svg>
            <span className="font-semibold text-[var(--color-text)]">PadelFlow</span>
          </div>
          <p>© 2026 PadelFlow. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/courts" className="hover:text-[var(--color-text)] transition-colors">Courts</Link>
            <Link href="/events" className="hover:text-[var(--color-text)] transition-colors">Events</Link>
            <Link href="/coaches" className="hover:text-[var(--color-text)] transition-colors">Coaches</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
