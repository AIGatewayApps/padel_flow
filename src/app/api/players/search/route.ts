import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searchRatelimit } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit by userId
  if (searchRatelimit) {
    const { success } = await searchRatelimit.limit(userId);
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const users = await db.user.findMany({
    where: {
      AND: [
        { settings: { profilePublic: true } },
        { OR: [
          { username: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
        ]},
      ],
    },
    select: { id: true, username: true, displayName: true, avatarUrl: true },
    take: 10,
  });
  return NextResponse.json(users);
}
