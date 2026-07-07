import Stripe from "stripe";

// ponytail: single instance, server-only
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
  typescript: true,
});
