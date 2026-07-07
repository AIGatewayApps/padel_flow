import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recurringSlots = await db.courtSlot.findMany({
    where: { recurrence: { in: ["WEEKLY", "BIWEEKLY"] } },
    include: { court: { select: { id: true } } },
  });

  let created = 0;
  for (const slot of recurringSlots) {
    const newStart = new Date(slot.startsAt);
    newStart.setDate(newStart.getDate() + 7);
    const newEnd = new Date(slot.endsAt);
    newEnd.setDate(newEnd.getDate() + 7);

    const exists = await db.courtSlot.findFirst({
      where: { courtId: slot.courtId, startsAt: newStart },
    });
    if (!exists) {
      await db.courtSlot.create({
        data: {
          courtId: slot.courtId,
          startsAt: newStart,
          endsAt: newEnd,
          available: true,
          recurrence: slot.recurrence,
        },
      });
      created++;
    }
  }

  return NextResponse.json({ ok: true, slotsCreated: created });
}
