import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const payload = await req.json();
  const evt = payload;

  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      const clerkUser = evt.data;
      const email = clerkUser.email_addresses?.[0]?.email_address ?? "";
      const role = (clerkUser.public_metadata?.role ?? "PLAYER");
      const subData = clerkUser.private_metadata as { pro?: boolean };
      const isPro = subData?.pro === true;

      await db.user.upsert({
        where: { id: clerkUser.id },
        update: {
          email,
          displayName: `${clerkUser.first_name ?? ""} ${clerkUser.last_name ?? ""}`.trim() || clerkUser.username ?? "Player",
          avatarUrl: clerkUser.image_url ?? undefined,
          role: role as string,
          subscription: isPro ? "PRO" : "FREE",
        },
        create: {
          id: clerkUser.id,
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
      if (evt.data.id) {
        await db.user.delete({ where: { id: evt.data.id } }).catch(() => null);
      }
      break;
    }
    case "subscription.created":
    case "subscription.updated": {
      const subData = evt.data;
      const clerkUserId = subData.user_id;
      if (!clerkUserId) break;
      const status = subData.status;
      const isPro = status === "active" || status === "trialing";
      await db.user.update({
        where: { id: clerkUserId },
        data: { subscription: isPro ? "PRO" : "FREE" },
      });
      break;
    }
    case "subscription.deleted": {
      const clerkUserId = evt.data.user_id;
      if (!clerkUserId) break;
      await db.user.update({
        where: { id: clerkUserId },
        data: { subscription: "FREE" },
      });
      break;
    }
  }
  return NextResponse.json({ ok: true });
}
