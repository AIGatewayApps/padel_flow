import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const result = await db.user.updateMany({
    where: { streak: { gt: 0 }, lastPlayedAt: { lt: twoDaysAgo } },
    data: { streak: 0 },
  });

  return NextResponse.json({ ok: true, streaksReset: result.count });
}
