import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

const PAYMENT_TYPE = {
  BOOKING: "booking",
  TICKET: "ticket",
  ORDER: "order",
  COACH_HIRE: "coach_hire",
} as const;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature") ?? "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const meta = session.metadata ?? {};

    if (meta.type === PAYMENT_TYPE.BOOKING && meta.bookingId) {
      await db.booking.update({
        where: { id: meta.bookingId },
        data: { status: "CONFIRMED", stripeId: session.id },
      });
      const booking = await db.booking.findUnique({
        where: { id: meta.bookingId },
        include: { court: true },
      });
      if (booking) {
        await db.notification.create({
          data: {
            userId: booking.userId,
            type: "booking_confirmed",
            body: `Your booking at ${booking.court.name} is confirmed.`,
            href: `/bookings/${booking.id}`,
          },
        });
      }
    }

    if (meta.type === PAYMENT_TYPE.TICKET && meta.ticketId) {
      await db.ticket.update({
        where: { id: meta.ticketId },
        data: { stripeId: session.id },
      });
    }

    if (meta.type === PAYMENT_TYPE.ORDER && meta.orderId) {
      await db.order.update({
        where: { id: meta.orderId },
        data: { status: "PAID", stripeId: session.id },
      });
      const order = await db.order.findUnique({
        where: { id: meta.orderId },
        include: { items: true },
      });
      if (order) {
        // Decrement stock — guarded: skip items where stock would go below 0
        await Promise.all(
          order.items.map((item) =>
            db.product.updateMany({
              where: { id: item.productId, stock: { gte: item.qty } },
              data: { stock: { decrement: item.qty } },
            })
          )
        );
      }
    }

    if (meta.type === PAYMENT_TYPE.COACH_HIRE && meta.hireId) {
      await db.coachHire.update({
        where: { id: meta.hireId },
        data: { status: "CONFIRMED", stripeId: session.id },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
