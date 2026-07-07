import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const metadata = { title: "Admin Analytics" };

export default async function AdminAnalyticsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/dashboard");

  const [
    totalUsers, totalCourts, totalBookings, totalEvents, totalTickets,
    totalOrders, totalPosts, totalClubs, totalCoaches,
  ] = await Promise.all([
    db.user.count(),
    db.court.count(),
    db.booking.count(),
    db.event.count(),
    db.ticket.count(),
    db.order.count(),
    db.post.count(),
    db.club.count(),
    db.coach.count(),
  ]);

  const bookingRevenue = await db.booking.aggregate({ where: { status: "CONFIRMED" }, _sum: { totalAmount: true } });
  const orderRevenue = await db.order.aggregate({ where: { status: "PAID" }, _sum: { total: true } });
  const coachRevenue = await db.coachHire.aggregate({ where: { status: "CONFIRMED" }, _sum: { totalAmount: true } });
  const totalRevenue = (bookingRevenue._sum.totalAmount ?? 0) + (orderRevenue._sum.total ?? 0) + (coachRevenue._sum.totalAmount ?? 0);

  const proUsers = await db.user.count({ where: { subscription: "PRO" } });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentSignups = await db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } });

  const stats = [
    { label: "Total users", value: totalUsers, color: "text-green-600" },
    { label: "Pro subscribers", value: proUsers, color: "text-yellow-500" },
    { label: "New this week", value: recentSignups, color: "text-blue-600" },
    { label: "Total courts", value: totalCourts, color: "text-green-600" },
    { label: "Total bookings", value: totalBookings, color: "text-blue-600" },
    { label: "Total events", value: totalEvents, color: "text-purple-600" },
    { label: "Tickets sold", value: totalTickets, color: "text-green-600" },
    { label: "Orders", value: totalOrders, color: "text-blue-600" },
    { label: "Posts", value: totalPosts, color: "text-green-600" },
    { label: "Clubs", value: totalClubs, color: "text-purple-600" },
    { label: "Coaches", value: totalCoaches, color: "text-green-600" },
    { label: "Total revenue", value: `$${totalRevenue.toFixed(0)}`, color: "text-green-600" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
