import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { eventSchema } from "@/lib/validations";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("EVENT_MANAGER", "ADMIN");
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const profile = await db.eventManagerProfile.findUnique({ where: { userId } });
  const event = await db.event.findUnique({ where: { id } });
  if (!event || event.managerId !== profile?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = eventSchema.partial().safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = { ...parsed.data, ...(parsed.data.startsAt ? { startsAt: new Date(parsed.data.startsAt) } : {}), ...(parsed.data.endsAt ? { endsAt: new Date(parsed.data.endsAt) } : {}) };
  const updated = await db.event.update({ where: { id }, data });
  return NextResponse.json(updated);
}
