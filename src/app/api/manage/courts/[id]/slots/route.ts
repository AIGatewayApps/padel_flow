import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({ startsAt: z.string().datetime(), endsAt: z.string().datetime() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("COURT_MANAGER", "ADMIN");
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: courtId } = await params;
  const profile = await db.courtManagerProfile.findUnique({ where: { userId } });
  const court = await db.court.findUnique({ where: { id: courtId } });
  if (!court || court.managerId !== profile?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { startsAt, endsAt } = schema.parse(await req.json());
  const slot = await db.courtSlot.create({ data: { courtId, startsAt: new Date(startsAt), endsAt: new Date(endsAt) } });
  return NextResponse.json(slot);
}
