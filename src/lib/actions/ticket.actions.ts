"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgRole } from "@/lib/permissions";

export async function scanTicket(eventId: string, qrCode: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // All events are now org-owned — verify caller is ORG_ADMIN of the event's org
  const event = await db.event.findUnique({ where: { id: eventId }, select: { orgId: true } });
  if (!event) throw new Error("Event not found");

  await requireOrgRole(userId, event.orgId, ["ORG_ADMIN"]);

  const ticket = await db.ticket.findFirst({
    where: { qrCode, eventId },
    include: { user: { select: { name: true } } },
  });
  if (!ticket) throw new Error("Invalid ticket");
  if (ticket.scanned) throw new Error("Already scanned");

  await db.ticket.update({ where: { id: ticket.id }, data: { scanned: true } });
  revalidatePath(`/manage/events/${eventId}/scan`);
  return { name: ticket.user.name ?? 'Guest' };
}
