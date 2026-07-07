import { redirect, notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { canUserInOrg } from "@/lib/permissions";
import type { Metadata } from "next";

type Props = { params: { slug: string } };
export const metadata: Metadata = { title: "Revenue" };

export default async function OrgRevenuePage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const org = await db.organization.findUnique({
    where: { slug: params.slug, deletedAt: null },
    include: { locations: { select: { id: true } } },
  });
  if (!org) notFound();

  const canView = await canUserInOrg(org.id, "reports.view");
  if (!canView) redirect(`/org/${params.slug}`);

  const locationIds = org.locations.map(l => l.id);

  const [bookingRevenue, coachRevenue, ticketRevenue, recentBookings] = await Promise.all([
    db.booking.aggregate({
      where: { status: "CONFIRMED", court: { locationId: { in: locationIds } } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    db.coachHire.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { totalAmount: true },
      _count: true,
    }),
    db.ticket.aggregate({
      where: { event: { locationId: { in: locationIds } } },
      _count: true,
    }),
    db.booking.findMany({
      where: { court: { locationId: { in: locationIds } } },
      include: { user: { select: { displayName: true } }, court: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const totalRevenue = (bookingRevenue._sum.totalAmount ?? 0) + (coachRevenue._sum.totalAmount ?? 0);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Revenue</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total revenue", value: `$${totalRevenue.toFixed(0)}`, color: "text-green-600" },
          { label: "Court bookings", value: `$${(bookingRevenue._sum.totalAmount ?? 0).toFixed(0)}`, color: "text-blue-600" },
          { label: "Coach sessions", value: `$${(coachRevenue._sum.totalAmount ?? 0).toFixed(0)}`, color: "text-purple-600" },
          { label: "Tickets sold", value: ticketRevenue._count, color: "text-orange-500" },
        ].map(stat => (
          <div key={stat.label} className="border rounded-2xl p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Recent bookings</h2>
      <div className="flex flex-col gap-2">
        {recentBookings.map(b => (
          <div key={b.id} className="border rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{b.user.displayName}</p>
              <p className="text-gray-400 text-xs">{b.court.name} · {new Date(b.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                b.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                b.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
              }`}>{b.status}</span>
              <span className="font-semibold">${b.totalAmount.toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
