import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";

export default async function OrderConfirmPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ success?: string }> }) {
  const { id } = await params;
  const { success } = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const order = await db.order.findUnique({ where: { id }, include: { items: { include: { product: true } } } });
  if (!order || order.userId !== userId) notFound();
  return (
    <div className="max-w-xl mx-auto">
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-green-700 font-medium">Order confirmed! 🎉</div>}
      <h1 className="text-2xl font-bold mb-6">Order #{order.id.slice(-8).toUpperCase()}</h1>
      <ul className="flex flex-col gap-3 mb-6">
        {order.items.map(item => (
          <li key={item.id} className="flex justify-between border rounded-xl px-4 py-3">
            <span>{item.product.name} × {item.qty}</span>
            <span className="font-medium">${(item.price * item.qty).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between font-bold text-lg border-t pt-4">
        <span>Total</span><span>${order.total.toFixed(2)}</span>
      </div>
    </div>
  );
}
