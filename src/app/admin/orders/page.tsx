import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export const metadata = { title: "Admin — Orders" };

export default async function AdminOrdersPage() {
  await requireRole("ADMIN");
  const orders = await db.order.findMany({
    include: { user: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Admin</Link>
        <h1 className="text-2xl font-bold">Orders ({orders.length})</h1>
      </div>
      {orders.length === 0 && <p className="text-gray-500">No orders yet.</p>}
      <div className="flex flex-col gap-3">
        {orders.map(o => (
          <div key={o.id} className="border rounded-xl p-4 bg-white dark:bg-gray-900">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">{o.user.displayName} <span className="text-gray-400 text-sm">@{o.user.username}</span></p>
                <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">${o.total.toFixed(2)}</p>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${o.status === "PAID" ? "bg-green-100 text-green-700" : o.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>{o.status}</span>
              </div>
            </div>
            <ul className="text-sm text-gray-500 flex flex-wrap gap-2">
              {o.items.map(i => <li key={i.id}>{i.product.name} ×{i.qty}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
