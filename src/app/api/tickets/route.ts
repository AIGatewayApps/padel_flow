import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { z } from "zod";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { eventId } = z.object({ eventId: z.string().cuid() }).parse(await req.json());
  const event = await db.event.findUnique({ where: { id: eventId }, include: { _count: { select: { tickets: true } } } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (event.capacity && event._count.tickets >= event.capacity) return NextResponse.json({ error: "Sold out" }, { status: 409 });
  const existing = await db.ticket.findFirst({ where: { eventId, userId } });
  if (existing) return N