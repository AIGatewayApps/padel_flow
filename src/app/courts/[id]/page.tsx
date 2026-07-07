import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import BookingButton from "./booking-button";

export default async function CourtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const court = await db.court.findUnique({
    where: { id },
    include: {
      slots: { where: { available: true, startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 20 },
    },
  });
  if (!court) notFound();

  return (
    <main className="max-w-3xl mx-auto p-8">
      {court.imageUrl && (
        <Image src={court.imageUrl} alt={court.name} width={800} height={400} className="w-full h-64 object-cover rounded-xl mb-6" />
      )}
      <h1 className="text-3xl font-bold">{court.name}</h1>
      <p className="text-gray-500">{court.address}, {court.city}</p>
      <p className="text-green-600 font-semibold mt-1">${court.pricePerHour}/hr</p>
      {court.description && <p className="mt-4 text-gray-700">{court.description}</p>}

      <h2 className="text-xl font-semibold mt-8 mb-4">Available slots</h2>
      {court.slots.length === 0 && <p className="text-gray-500">No slots available.</p>}
      <ul className="flex flex-col gap-3">
        {court.slots.map(slot => (
          <li key={slot.id} className="flex items-center justify-between border rounded-lg px-4 py-3">
            <span>{new Date(slot.startsAt).toLocaleString()} – {new Date(slot.endsAt).toLocaleTimeString()}</span>
            <BookingButton courtId={court.id} slotId={slot.id} pricePerHour={court.pricePerHour} />
          </li>
        ))}
      </ul>
    </main>
  );
}
