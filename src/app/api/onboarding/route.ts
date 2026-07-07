import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(60),
  role: z.enum(["PLAYER", "COURT_MANAGER", "EVENT_MANAGER"]),
  city: z.string().optional(),
  country: z.string().optional(),
  companyName: z.string().optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { username, displayName, role, city, country, companyName } = parsed.data;

  // Ensure username is unique
  const taken = await db.user.findUnique({ where: { username } });
  if (taken) return NextResponse.json({ error: "Username taken" }, { status: 409 });

  // Create DB user + settings
  await db.user.create({
    data: {
      id: userId,
      email: "", // Clerk webhook will fill this; OK for now
      username,
      displayName,
      role,
      city,
      country,
      settings: { create: {} },
      ...(role === "PLAYER" && { profile: { create: {} } }),
      ...(role === "COURT_MANAGER" && { courtManager: { create: { companyName: companyName ?? "" } } }),
      ...(role === "EVENT_MANAGER" && { eventManager: { create: { companyName: companyName ?? "" } } }),
    },
  });

  // Stamp role on Clerk public metadata so middleware can read it from session
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, { publicMetadata: { role } });

  return NextResponse.json({ ok: true });
}
