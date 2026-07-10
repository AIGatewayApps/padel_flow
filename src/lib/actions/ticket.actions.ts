"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrgRole } from "@/lib/permissions";
import type { ActionResult } from "@/lib/types";

export async function scanTicket(
  eventId: string,
  qrCode: string
): Promise<ActionResult<{ name: string }>> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { orgId: true },
  });
  if (!event) return { success: false, error: "Event not found", code: "NOT_FOUND" };

  await requireOrgRole(clerkId, event.orgId, ["ORG_ADMIN"]);

  const ticket = await db.ticket.findFirst({
    where: { qrCode, eventId },
    include: { user: { select: { name: true } } },
  });
  if (!ticket) return { success: false, error: "Invalid ticket", code: "NOT_FOUND" };
  if (ticket.scanned) return { success: false, error: "Already scanned", code: "ALREADY_SCANNED" };

  await db.ticket.update({ where: { id: ticket.id }, data: { scanned: true } });
  revalidatePath(`/manage/events/${eventId}/scan`);
  return { success: true, data: { name: ticket.user.name ?? "Guest" } };
}
