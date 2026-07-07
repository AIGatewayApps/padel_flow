import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { postSchema } from "@/lib/validations";
import { postRatelimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 10 posts per minute
  if (postRatelimit) {
    const { success } = await postRatelimit.limit(userId);
    if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const post = await db.post.create({ data: { authorId: userId, ...parsed.data } });
  return NextResponse.json(post);
}
