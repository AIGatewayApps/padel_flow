import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireRole("ADMIN");

  const [users, courts, events, orders] = await Promise.all([
    db.user.count(),
    db.court.count(),
    db.event.count(),
    db.order.count(),
  ]);

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[{ label: "Users", value: users }, { label: "Courts", value: courts }, { label: "Events", value: events }, { label: "Orders", value: orders }]
          .map(s => (
            <div key={s.label} className="border rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-gray-500">{s.label}</p>
            </div>
          ))}
      </div>
      <nav className="flex flex-col gap-3">
        <Link href="/admin/users" className="border rounded-xl p-4 hover:bg-gray-50">Manage Users</Link>
        <Link href="/admin/products" className="border rounded-xl p-4 hover:bg-gray-50">Manage Store / Products</Link>
        <Link href="/admin/orders" className="border rounded-xl p-4 hover:bg-gray-50">Manage Orders</Link>
        <Link href="/admin/courts" className="border rounded-xl p-4 hover:bg-gray-50">Oversee Courts</Link>
        <Link href="/admin/events" className="border rounded-xl p-4 hover:bg-gray-50">Oversee Events</Link>
      </nav>
    </main>
  );
}
