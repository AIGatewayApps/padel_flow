import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";

export const metadata = { title: "Coach Portal" };

export default async function CoachPortalPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const coach = await db.coach.findUnique({
    where: { userId },
    include: {
      hires: {
        include: { student: { select: { displayName: true, avatarUrl: true, username: true } } },
        orderBy: { scheduledAt: "asc" },
        take: 20,
      },
      availability: { orderBy: { dayOfWeek: "asc" } },
    },
  });

  if (!coach) redirect("/onboarding");

  const upcoming = coach.hires.filter(h => h.scheduledAt >= new Date() && h.status === "CONFIRMED");
  const pending = coach.hires.filter(h => h.status === "PENDING");
  const past = coach.hires.filter(h => h.scheduledAt < new Date() || h.status === "COMPLETED");

  const totalEarned = coach.hires
    .filter(h => h.status === "CONFIRMED" || h.status === "COMPLETED")
    .reduce((s, h) => s + h.totalAmount, 0);

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0 flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Coach Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your sessions and availability</p>
        </div>
        <Link href="/coach-portal/settings" className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors text-center">
          Edit profile
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Upcoming", value: upcoming.length, color: "text-green-600" },
          { label: "Pending", value: pending.length, color: "text-yellow-500" },
          { label: "Completed", value: past.length, color: "text-gray-600" },
          { label: "Earned", value: `$${totalEarned.toFixed(0)}`, color: "text-green-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending bookings */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3">Pending requests ({pending.length})</h2>
          <div className="flex flex-col gap-3">
            {pending.map(hire => (
              <div key={hire.id} className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{hire.student.displayName}</p>
                  <p className="text-sm text-gray-500">{new Date(hire.scheduledAt).toLocaleString()} · ${hire.totalAmount}/hr</p>
                  {hire.notes && <p className="text-xs text-gray-400 mt-1 italic">"{hire.notes}"</p>}
                </div>
                <div className="flex gap-2">
                  <form action={async () => { "use server"; const { db } = await import("@/lib/db"); await db.coachHire.update({ where: { id: hire.id }, data: { status: "CONFIRMED" } }); }}>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700">Accept</button>
                  </form>
                  <form action={async () => { "use server"; const { db } = await import("@/lib/db"); await db.coachHire.update({ where: { id: hire.id }, data: { status: "CANCELLED" } }); }}>
                    <button className="border px-4 py-2 rounded-xl text-sm hover:bg-gray-50">Decline</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming sessions */}
      <section>
        <h2 className="text-base font-semibold mb-3">Upcoming sessions</h2>
        {upcoming.length === 0 && <p className="text-gray-400 text-sm">No upcoming sessions.</p>}
        <div className="flex flex-col gap-3">
          {upcoming.map(hire => (
            <div key={hire.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{hire.student.displayName}</p>
                <p className="text-sm text-gray-500">{new Date(hire.scheduledAt).toLocaleString()}</p>
              </div>
              <Link href={`/messages`} className="text-sm text-green-600 hover:underline">Message</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Availability */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Weekly availability</h2>
          <Link href="/coach-portal/availability" className="text-sm text-green-600 hover:underline">Edit</Link>
        </div>
        {coach.availability.length === 0 && <p className="text-gray-400 text-sm">No availability set yet.</p>}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {coach.availability.map(a => (
            <div key={a.id} className="bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2 text-sm">
              <span className="font-medium">{DAYS[a.dayOfWeek]}</span>
              <span className="text-gray-500 ml-2">{a.startHour}:00 – {a.endHour}:00</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
