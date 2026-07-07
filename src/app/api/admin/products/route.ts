import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1), description: z.string().optional(),
  price: z.number().positive(), stock: z.number().int().min(0),
  category: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  await requireRole("ADMIN");
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const product = await db.product.create({ data: parsed.data });
  return NextResponse.json(product);
}
