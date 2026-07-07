import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { status } = z.object({ status: z.enum(["ACCEPTED", "BLOCKED"]) }).parse(await req.json());
  const f = await db.friendship.findUnique({ where: { id } });
  if (!f || f.receiverId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await db.friendship.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const f = await db.friendship.findUnique({ where: { id } });
  if (!f || (f.initiatorId !== userId && f.receiverId !== userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await db.friendship.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
