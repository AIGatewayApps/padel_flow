import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import Image from "next/image";
import TicketButton from "./ticket-button";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  const event = await db.event.findUnique({
    where: { id },
    include: { _count: { select: { tickets: true } } },
  });
  if (!event) notFound();

  const hasTicket = userId ? !!(await db.ticket.findFirst({ where: { eventId: id, userId } })) : false;
  const soldOut = event.capacity ? event._count.tickets >= event.capacity : false;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {event.imageUrl && <Image src={event.imageUrl} alt={event.title} width={800} height={400} className="w-full h-64 object-cover rounded-xl" />}
      <div className="bg-white dark:bg-gray-900 border rounded-xl p-6">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <p className="text-gray-500 mt-1">{event.location}</p>
        <p className="text-sm text-gray-400 mt-1">{new Date(event.startsAt).toLocaleString()} – {new Date(event.endsAt).toLocaleString()}</p>
        {event.description && <p className="mt-4 text-gray-700 dark:text-gray-300">{event.description}</p>}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div>
            <p className="text-2xl font-bold text-green-600">{event.ticketPrice === 0 ? "Free" : `$${event.ticketPrice}`}</p>
            {event.capacity && <p className="text-sm text-gray-400">{event._count.tickets} / {event.capacity} tickets sold</p>}
          </div>
          {userId && !hasTicket && !soldOut && <TicketButton eventId={id} price={event.ticketPrice} />}
          {hasTicket && <span className="text-green-600 font-semibold">You have a ticket ✓</span>}
          {soldOut && !hasTicket && <span className="text-red-500 font-semibold">Sold out</span>}
        </div>
      </div>
    </div>
  );
}
