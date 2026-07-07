import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-06-30.basil" });

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect("/sign-in");

  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, stripeCustomerId: true } });
  if (!user) return NextResponse.redirect("/sign-in");

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { userId } });
    customerId = customer.id;
    await db.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pro?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pro`,
    metadata: { userId },
  });

  return NextResponse.redirect(session.url!);
}
