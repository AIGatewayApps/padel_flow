import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let evt: { type: string; data: Record<string, unknown> };
  try {
    evt = wh.verify(body, {
      "svix-id": headersList.get("svix-id") ?? "",
      "svix-timestamp": headersList.get("svix-timestamp") ?? "",
      "svix-signature": headersList.get("svix-signature") ?? "",
    }) as typeof evt;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (evt.type === "user.deleted") {
    const id = evt.data.id as string;
    await db.user.deleteMany({ where: { id } });
  }

  return NextResponse.json({ ok: true });
}
