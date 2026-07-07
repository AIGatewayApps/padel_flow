"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function scanTicket(eventId: string, qrCode: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify requester manages this event
  const event = await db.event.findUnique({ where: { id: eventId }, include: { manager: { select: { userId: true } } } });
  if (!event || event.manager.userId !== userId) throw new Error("Forbidden");

  const ticket = await db.ticket.findFirst({
    where: { qrCode, eventId },
    include: { user: { select: { displayName: true } } },
  });
  if (!ticket) throw new Error("Invalid ticket");
  if (ticket.scanned) throw new Error("Already scanned");

  await db.ticket.update({ where: { id: ticket.id }, data: { scanned: true } });
  revalidatePath(`/manage/events/${eventId}/scan`);
  return { name: ticket.user.displayName };
}
