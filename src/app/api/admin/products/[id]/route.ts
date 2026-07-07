import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(), description: z.string().optional(),
  price: z.number().positive().optional(), stock: z.number().int().min(0).optional(),
  category: z.string().nullable().optional(), active: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const product = await db.product.update({ where: { id }, data: parsed.data });
  return NextResponse.json(product);
}
