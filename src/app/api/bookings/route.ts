import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { bookingSchema } from "@/lib/validations";

const PAYMENT_TYPE = {
  BOOKING: "booking",
  TICKET: "ticket",
  ORDER: "order",
  COACH_HIRE: "coach_hire",
} as const;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { courtId, slotId } = parsed.data;

  // Atomic slot claim + booking creation in a single transaction
  let booking;
  try {
    booking = await db.$transaction(async (tx) => {
      // Atomically claim the slot — throws if already taken
      const slot = await tx.courtSlot.update({
        where: { id: slotId, courtId, available: true },
        data: { available: false },
        include: { court: true },
      });

      const hours = (slot.endsAt.getTime() - slot.startsAt.getTime()) / 3_600_000;
      return tx.booking.create({
        data: {
          userId,
          courtId,
          slotId,
          status: "PENDING",
          totalAmount: slot.court.pricePerHour * hours,
        },
        include: { court: true, slot: true },
      });
    });
  } catch {
    return NextResponse.json({ error: "Slot unavailable" }, { status: 409 });
  }

  const hours =
    (booking.slot.endsAt.getTime() - booking.slot.startsAt.getTime()) / 3_600_000;
  const amount = Math.round(booking.court.pricePerHour * hours * 100);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: amount,
          product_data: {
            name: `${booking.court.name} – ${booking.slot.startsAt.toLocaleDateString()}`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking.id}?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courts/${courtId}`,
    metadata: { type: PAYMENT_TYPE.BOOKING, bookingId: booking.id },
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
