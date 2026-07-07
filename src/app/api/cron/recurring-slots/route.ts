import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recurringSlots = await db.courtSlot.findMany({
    where: { recurrence: { in: ["WEEKLY", "BIWEEKLY"] } },
  });

  if (recurringSlots.length === 0) {
    return NextResponse.json({ ok: true, slotsCreated: 0 });
  }

  // Compute next occurrence: WEEKLY = +7 days, BIWEEKLY = +14 days
  const candidates = recurringSlots.map((slot) => {
    const daysToAdd = slot.recurrence === "BIWEEKLY" ? 14 : 7;
    const newStart = new Date(slot.startsAt);
    newStart.setDate(newStart.getDate() + daysToAdd);
    const newEnd = new Date(slot.endsAt);
    newEnd.setDate(newEnd.getDate() + daysToAdd);
    return { slot, newStart, newEnd };
  });

  // Batch-check which slots already exist
  const existingSlots = await db.courtSlot.findMany({
    where: {
      OR: candidates.map((c) => ({
        courtId: c.slot.courtId,
        startsAt: c.newStart,
      })),
    },
    select: { courtId: true, startsAt: true },
  });

  const existingKeys = new Set(
    existingSlots.map((s) => `${s.courtId}::${s.startsAt.toISOString()}`)
  );

  const toCreate = candidates.filter(
    (c) => !existingKeys.has(`${c.slot.courtId}::${c.newStart.toISOString()}`)
  );

  if (toCreate.length > 0) {
    await db.courtSlot.createMany({
      data: toCreate.map((c) => ({
        courtId: c.slot.courtId,
        startsAt: c.newStart,
        endsAt: c.newEnd,
        available: true,
        recurrence: c.slot.recurrence,
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ ok: true, slotsCreated: toCreate.length });
}
