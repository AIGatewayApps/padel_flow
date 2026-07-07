import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Court Manager Portal" };

export default async function CourtManagerPortalPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const manager = await db.courtManagerProfile.findUnique({
    where: { userId },
    include: {
      courts: {
        include: {
          _count: { select: { bookings: true, slots: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!manager) redirect("/onboarding");

  const totalCourts = manager.courts.length;
  const totalBookings = manager.courts.reduce((s, c) => s + c._count.bookings, 0);
  const totalRevenue = await db.booking.aggregate({
    where: { court: { managerId: manager.id }, status: "CONFIRMED" },
    _sum: { totalAmount: true },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0 flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Court Manager Portal</h1>
          <p className="text-gray-500 text-sm mt-1">{manager.companyName}</p>
        </div>
        <Link href="/manage/courts/new" className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors text-center">
          + Add court
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Courts", value: totalCourts, color: "text-green-600" },
          { label: "Total bookings", value: totalBookings, color: "text-blue-600" },
          { label: "Revenue", value: `$${(totalRevenue._sum.totalAmount ?? 0).toFixed(0)}`, color: "text-green-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-base font-semibold mb-3">Your courts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {manager.courts.map(court => (
            <Link key={court.id} href={`/courts/${court.id}`}
              className="border rounded-2xl p-4 bg-white dark:bg-gray-900 hover:border-green-400 transition-colors flex items-center gap-4">
              {court.imageUrl
                ? <Image src={court.imageUrl} alt={court.name} width={48} height={48} className="rounded-xl object-cover" />
                : <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-xl">Court</div>}
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{court.name}</p>
                <p className="text-xs text-gray-400">{court.city} - ${court.pricePerHour}/hr</p>
              </div>
              <Link href={`/manage/courts/${court.id}/slots`}
                className="text-xs bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                Slots
              </Link>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
