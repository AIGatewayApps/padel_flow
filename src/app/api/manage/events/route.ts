import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { eventSchema } from "@/lib/validations";

export async function POST(req: Request) {
  await requireRole("EVENT_MANAGER", "ADMIN");
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = eventSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const profile = await db.eventManagerProfile.findUnique({ where: { userId } });
  if (!profile) return NextResponse.json({ error: "No event manager profile" }, { status: 403 });
  const event = await db.event.create({ data: { ...parsed.data, managerId: profile.id, startsAt: new Date(parsed.data.startsAt), endsAt: new Date(parsed.data.endsAt) } });
  return NextResponse.json(event);
}
