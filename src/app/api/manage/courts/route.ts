import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { courtSchema } from "@/lib/validations";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireRole("COURT_MANAGER", "ADMIN");

  const profile = await db.courtManagerProfile.findUnique({ where: { userId } });
  if (!profile) return NextResponse.json({ courts: [] });

  const courts = await db.court.findMany({
    where: { managerId: profile.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(courts);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireRole("COURT_MANAGER", "ADMIN");

  const parsed = courtSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const profile = await db.courtManagerProfile.findUnique({ where: { userId } });
  if (!profile) return NextResponse.json({ error: "No court manager profile" }, { status: 403 });

  const court = await db.court.create({ data: { ...parsed.data, managerId: profile.id } });
  return NextResponse.json(court, { status: 201 });
}
