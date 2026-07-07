import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { bookingSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { courtId, slotId } = parsed.data;

  // Verify slot is still available — atomic check
  const slot = await db.courtSlot.findUnique({ where: { id: slotId }, include: { court: true } });
  if (!slot || !slot.available || slot.courtId !== courtId) {
    return NextResponse.json({ error: "Slot unavailable" }, { status: 409 });
  }

  const hours = (slot.endsAt.getTime() - slot.startsAt.getTime()) / 3_600_000;
  const amount = Math.round(slot.court.pricePerHour * hours * 100); // cents

  // Create pending booking first
  const booking = await db.booking.create({
    data: { userId, courtId, slotId, status: "PENDING", totalAmount: slot.court.pricePerHour * hours },
  });

  // Mark slot taken immediately to prevent race conditions
  await db.courtSlot.update({ where: { id: slotId }, data: { available: false } });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price_data: { currency: "usd", unit_amount: amount, product_data: { name: `${slot.court.name} – ${slot.startsAt.toLocaleDateString()}` } }, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking.id}?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courts/${courtId}`,
    metadata: { type: "booking", bookingId: booking.id },
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
