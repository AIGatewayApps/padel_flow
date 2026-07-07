import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import CourtCalendar from "./court-calendar";

export const metadata = { title: "Book a slot" };

export default async function CourtCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const court = await db.court.findUnique({
    where: { id, active: true },
    include: {
      slots: {
        where: { startsAt: { gte: new Date() } },
        orderBy: { startsAt: "asc" },
        take: 200,
      },
    },
  });
  if (!court) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <h1 className="text-2xl font-bold mb-6">{court.name} — Book a slot</h1>
      <CourtCalendar
        courtId={court.id}
        pricePerHour={court.pricePerHour}
        slots={court.slots.map(s => ({
          id: s.id,
          startsAt: s.startsAt.toISOString(),
          endsAt: s.endsAt.toISOString(),
          available: s.available,
        }))}
      />
    </div>
  );
}
