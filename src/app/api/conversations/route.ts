import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { username } = await req.json();
  const other = await db.user.findUnique({ where: { username } });
  if (!other) return NextResponse.json({ error: "User not found" }, { status: 404 });
  // Reuse existing 1:1 convo if it exists
  const existing = await db.conversationMember.findFirst({
    where: { userId, conversation: { members: { some: { userId: other.id } } } },
    select: { conversationId: true },
  });
  if (existing) return NextResponse.json({ id: existing.conversationId });
  const convo = await db.conversation.create({
    data: { members: { create: [{ userId }, { userId: other.id }] } },
  });
  return NextResponse.json({ id: convo.id });
}
