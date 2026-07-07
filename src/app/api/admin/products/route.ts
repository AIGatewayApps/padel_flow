import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive().max(100_000),
  stock: z.number().int().min(0).max(100_000),
  category: z.string().max(100).nullable().optional(),
});

export async function GET() {
  await requireRole("ADMIN");
  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  await requireRole("ADMIN");
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const product = await db.product.create({ data: parsed.data });
  return NextResponse.json(product, { status: 201 });
}
