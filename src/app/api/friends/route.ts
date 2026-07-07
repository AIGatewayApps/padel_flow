import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId } = z.object({ receiverId: z.string() }).parse(await req.json());
  if (receiverId === userId) return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });

  // Check for existing friendship in either direction
  const existing = await db.friendship.findFirst({
    where: {
      OR: [
        { initiatorId: userId, receiverId },
        { initiatorId: receiverId, receiverId: userId },
      ],
    },
  });
  if (existing) return NextResponse.json(existing);

  // Fetch sender username for a personalised notification
  const sender = await db.user.findUnique({ where: { id: userId }, select: { username: true, name: true } });
  const senderName = sender?.name ?? sender?.username ?? "Someone";

  const friendship = await db.friendship.create({
    data: { initiatorId: userId, receiverId, status: "PENDING" },
  });

  await db.notification.create({
    data: {
      userId: receiverId,
      type: "friend_request",
      body: `${senderName} sent you a friend request.`,
      href: "/friends",
    },
  });

  return NextResponse.json(friendship);
}
