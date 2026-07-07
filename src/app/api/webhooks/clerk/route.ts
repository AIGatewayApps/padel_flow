import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();

  let evt: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(webhookSecret);
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: Record<string, unknown> };
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      const clerkUser = evt.data as {
        id: string;
        email_addresses?: { email_address: string }[];
        first_name?: string;
        last_name?: string;
        username?: string;
        image_url?: string;
        public_metadata?: { role?: string };
        private_metadata?: { pro?: boolean; onboarded?: boolean };
      };
      const email = clerkUser.email_addresses?.[0]?.email_address ?? "";
      const role = clerkUser.public_metadata?.role ?? "PLAYER";
      const isPro = clerkUser.private_metadata?.pro === true;

      await db.user.upsert({
        where: { clerkId: clerkUser.id },
        update: {
          email,
          displayName: `${clerkUser.first_name ?? ""} ${clerkUser.last_name ?? ""}`.trim() || clerkUser.username ?? "Player",
          avatarUrl: clerkUser.image_url ?? undefined,
          role: role as string,
          subscription: isPro ? "PRO" : "FREE",
        },
        create: {
          clerkId: clerkUser.id,
          email,
          username: clerkUser.username ?? clerkUser.id.slice(0, 16),
          displayName: `${clerkUser.first_name ?? ""} ${clerkUser.last_name ?? ""}`.trim() || clerkUser.username ?? "Player",
          avatarUrl: clerkUser.image_url ?? undefined,
          role: role as string,
          subscription: isPro ? "PRO" : "FREE",
          settings: { create: {} },
        },
      });
      break;
    }
    case "user.deleted": {
      const d = evt.data as { id?: string };
      if (d.id) {
        await db.user.delete({ where: { clerkId: d.id } }).catch(() => null);
      }
      break;
    }
    case "subscription.created":
    case "subscription.updated": {
      const subData = evt.data as { user_id?: string; status?: string };
      if (!subData.user_id) break;
      const isPro = subData.status === "active" || subData.status === "trialing";
      await db.user.update({
        where: { clerkId: subData.user_id },
        data: { subscription: isPro ? "PRO" : "FREE" },
      });
      break;
    }
    case "subscription.deleted": {
      const d = evt.data as { user_id?: string };
      if (!d.user_id) break;
      await db.user.update({
        where: { clerkId: d.user_id },
        data: { subscription: "FREE" },
      });
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
