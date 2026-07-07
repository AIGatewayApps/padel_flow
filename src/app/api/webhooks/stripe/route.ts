import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

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
      await db.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: meta.bookingId },
          data: { status: "CONFIRMED", stripeId: session.id },
        });
        const booking = await tx.booking.findUnique({
          where: { id: meta.bookingId },
          include: { court: true },
        });
        if (booking) {
          await tx.notification.create({
            data: {
              userId: booking.userId,
              type: "booking_confirmed",
              body: `Your booking at ${booking.court.name} is confirmed.`,
              href: `/bookings/${booking.id}`,
            },
          });
        }
      });
    }

    if (meta.type === PAYMENT_TYPE.TICKET && meta.eventId && meta.userId) {
      // Ticket created here (not in POST) to avoid orphans on payment failure
      await db.$transaction(async (tx) => {
        const existing = await tx.ticket.findFirst({
          where: { eventId: meta.eventId, userId: meta.userId },
        });
        if (!existing) {
          await tx.ticket.create({
            data: { eventId: meta.eventId, userId: meta.userId, qrCode: randomUUID(), stripeId: session.id },
          });
        }
      });
    }

    if (meta.type === PAYMENT_TYPE.ORDER && meta.userId && meta.itemsJson) {
      const items: Array<{ productId: string; qty: number }> = JSON.parse(meta.itemsJson);
      const total = parseFloat(meta.total ?? "0");

      await db.$transaction(async (tx) => {
        // Idempotency guard
        const existing = await tx.order.findFirst({ where: { stripeId: session.id } });
        if (existing) return;

        const products = await tx.product.findMany({
          where: { id: { in: items.map((i) => i.productId) } },
        });

        // Validate stock inside transaction
        for (const item of items) {
          const product = products.find((p) => p.id === item.productId);
          if (!product || product.stock < item.qty) throw new Error(`Stock insufficient for ${item.productId}`);
        }

        const order = await tx.order.create({
          data: {
            userId: meta.userId,
            total,
            status: "PAID",
            stripeId: session.id,
            items: {
              create: items.map((i) => ({
                productId: i.productId,
                qty: i.qty,
                price: products.find((p) => p.id === i.productId)!.price,
              })),
            },
          },
        });

        // Decrement stock atomically inside same transaction
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.qty } },
          });
        }

        await tx.notification.create({
          data: {
            userId: meta.userId,
            type: "order_confirmed",
            body: `Your order #${order.id.slice(-6).toUpperCase()} has been confirmed.`,
            href: `/shop/order/${order.id}`,
          },
        });
      });
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
