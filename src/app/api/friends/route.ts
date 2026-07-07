import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { receiverId } = z.object({ receiverId: z.string() }).parse(await req.json());
  if (receiverId === userId) return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
  const friendship = await db.friendship.upsert({
    where: { initiatorId_receiverId: { initiatorId: userId, receiverId } },
    create: { initiatorId: userId, receiverId, status: "PENDING" },
    update: {},
  });
  // Notify receiver
  await db.notification.create({ data: { userId: receiverId, type: "friend_request", body: "Someone sent you a friend request.", href: "/friends" } });
  return NextResponse.json(friendship);
}
