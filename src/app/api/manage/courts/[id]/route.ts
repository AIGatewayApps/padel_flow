import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { courtSchema } from "@/lib/validations";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("COURT_MANAGER", "ADMIN");
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const profile = await db.courtManagerProfile.findUnique({ where: { userId } });
  const court = await db.court.findUnique({ where: { id } });
  if (!court || (court.managerId !== profile?.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = courtSchema.partial().safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const updated = await db.court.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}
