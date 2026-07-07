import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";

export default async function BookingConfirmPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ success?: string }> }) {
  const { id } = await params;
  const { success } = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const booking = await db.booking.findUnique({ where: { id }, include: { court: true, slot: true } });
  if (!booking || booking.userId !== userId) notFound();
  return (
    <div className="max-w-xl mx-auto">
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-green-700 font-medium">Booking confirmed! 🎾</div>}
      <h1 className="text-2xl font-bold mb-6">Booking</h1>
      <div className="bg-white dark:bg-gray-900 border rounded-xl p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-lg">{booking.court.name}</h2>
        <p className="text-gray-500">{booking.court.address}, {booking.court.city}</p>
        <p className="text-sm">{new Date(booking.slot.startsAt).toLocaleString()} – {new Date(booking.slot.endsAt).toLocaleTimeString()}</p>
        <p className="font-bold text-green-600">${booking.totalAmount.toFixed(2)}</p>
        <span className={`text-sm font-medium px-3 py-1 rounded-full w-fit ${booking.status === "CONFIRMED" ? "bg-green-100 text-green-700" : booking.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
          {booking.status}
        </span>
      </div>
    </div>
  );
}
