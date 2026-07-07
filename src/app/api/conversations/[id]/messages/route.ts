import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messageSchema } from "@/lib/validations";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: conversationId } = await params;
  const member = await db.conversationMember.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const messages = await db.message.findMany({
    where: { conversationId },
    include: { sender: true },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return NextResponse.json(messages.map(m => ({ id: m.id, body: m.body, senderId: m.senderId, senderName: m.sender.displayName, senderAvatar: m.sender.avatarUrl, createdAt: m.createdAt.toISOString() })));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: conversationId } = await params;
  const member = await db.conversationMember.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { body } = messageSchema.parse({ conversationId, ...await req.json() });
  const msg = await db.message.create({ data: { conversationId, senderId: userId, body }, include: { sender: true } });
  return NextResponse.json({ id: msg.id, body: msg.body, senderId: msg.senderId, senderName: msg.sender.displayName, senderAvatar: msg.sender.avatarUrl, createdAt: msg.createdAt.toISOString() });
}
