import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

const schema = z.object({
  items: z.array(z.object({ productId: z.string().cuid(), qty: z.number().int().positive() })).min(1),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { items } = schema.parse(await req.json());

  const products = await db.product.findMany({
    where: { id: { in: items.map(i => i.productId) }, active: true },
  });

  const lineItems = items.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product || product.stock < item.qty) throw new Error(`Product ${item.productId} unavailable`);
    return {
      price_data: { currency: "usd", unit_amount: Math.round(product.price * 100), product_data: { name: product.name } },
      quantity: item.qty,
    };
  });

  const total = products.reduce((s, p) => {
    const qty = items.find(i => i.productId === p.id)?.qty ?? 0;
    return s + p.price * qty;
  }, 0);

  const order = await db.order.create({
    data: {
      userId,
      total,
      status: "PENDING",
      items: { create: items.map(i => ({ productId: i.productId, qty: i.qty, price: products.find(p => p.id === i.productId)!.price })) },
    },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop/order/${order.id}?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop`,
    metadata: { type: "order", orderId: order.id },
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
