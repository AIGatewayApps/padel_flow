import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function GET(req: Request) {
  await requireRole("ADMIN");
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const take = 50;

  const users = await db.user.findMany({
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });

  const nextCursor = users.length === take ? users[users.length - 1].id : null;
  return NextResponse.json({ users, nextCursor });
}
