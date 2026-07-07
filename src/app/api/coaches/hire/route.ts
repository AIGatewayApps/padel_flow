import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

const schema = z.object({ coachId: z.string().cuid(), scheduledAt: z.string().datetime() });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = schema.parse(await req.json());
  const coach = await db.coach.findUnique({ where: { id: body.coachId }, include: { user: true } });
  if (!coach || !coach.active) return NextResponse.json({ error: "Coach unavailable" }, { status: 404 });
  const hire = await db.coachHire.create({
    data: { studentId: userId, coachId: body.coachId, scheduledAt: new Date(body.scheduledAt), status: "PENDING", totalAmount: coach.pricePerHour },
  });
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price_data: { currency: "usd", unit_amount: Math.round(coach.pricePerHour * 100), product_data: { name: `Coaching session with ${coach.user.displayName}` } }, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/coaches?hired=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/coaches`,
    metadata: { type: "coach_hire", hireId: hire.id },
  });
  return NextResponse.json({ checkoutUrl: session.url });
}
