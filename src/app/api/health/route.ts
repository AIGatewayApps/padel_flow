import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();

  try {
    // Lightweight DB ping — count is cheap
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        db: "ok",
        latency_ms: Date.now() - start,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[health] db check failed", err);
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        db: "error",
        latency_ms: Date.now() - start,
      },
      { status: 503 }
    );
  }
}
