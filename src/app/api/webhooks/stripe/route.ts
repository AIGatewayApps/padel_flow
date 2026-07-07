import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const meta = session.metadata ?? {};
      if (meta.type === "booking" && meta.bookingId) {
        await db.booking.update({
          where: { id: meta.bookingId },
          data: { status: "CONFIRMED", stripeId: session.id },
        });
      }
      if (meta.type === "ticket" && meta.ticketId) {
        await db.ticket.update({
          where: { id: meta.ticketId },
          data: { stripeId: session.id },
        });
      }
      if (meta.type === "order" && meta.orderId) {
        await db.order.update({
          where: { id: meta.orderId },
          data: { status: "PAID", stripeId: session.id },
        });
      }
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
