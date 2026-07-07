import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { ratelimit } from "@/lib/ratelimit";
import { z } from "zod";

const schema = z.object({
  items: z.array(z.object({ productId: z.string().cuid(), qty: z.number().int().positive() })).min(1).max(50),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = await ratelimit.limit(userId);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { items } = parsed.data;

  const products = await db.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, active: true },
  });

  // Validate stock before touching DB
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 404 });
    if (product.stock < item.qty) return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 409 });
  }

  const lineItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return {
      price_data: {
        currency: "usd",
        unit_amount: Math.round(product.price * 100),
        product_data: { name: product.name },
      },
      quantity: item.qty,
    };
  });

  const total = products.reduce((s, p) => {
    const qty = items.find((i) => i.productId === p.id)?.qty ?? 0;
    return s + p.price * qty;
  }, 0);

  // Create order AFTER Stripe session to avoid orphans
  // ponytail: reserve stock atomically here when high-concurrency becomes a concern
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop/order/{CHECKOUT_SESSION_ID}?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop`,
    metadata: { type: "order", userId, itemsJson: JSON.stringify(items), total: String(total) },
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
