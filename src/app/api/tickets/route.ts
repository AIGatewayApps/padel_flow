import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { ratelimit } from "@/lib/ratelimit";
import { z } from "zod";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = await ratelimit.limit(userId);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { eventId } = z.object({ eventId: z.string().cuid() }).parse(await req.json());

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { tickets: true } } },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (event.capacity && event._count.tickets >= event.capacity)
    return NextResponse.json({ error: "Sold out" }, { status: 409 });

  const existing = await db.ticket.findFirst({ where: { eventId, userId } });
  if (existing) return NextResponse.json({ error: "Already have ticket" }, { status: 409 });

  // Free event — create ticket immediately
  if (event.ticketPrice === 0) {
    const { randomUUID } = await import("crypto");
    const ticket = await db.ticket.create({ data: { eventId, userId, qrCode: randomUUID() } });
    return NextResponse.json({ ok: true, ticketId: ticket.id });
  }

  // Paid event — create Stripe session first; webhook creates ticket on success
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        unit_amount: Math.round(event.ticketPrice * 100),
        product_data: { name: `Ticket: ${event.title}` },
      },
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}`,
    metadata: { type: "ticket", eventId, userId },
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
