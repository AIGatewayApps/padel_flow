import { requireRole } from "@/lib/auth";
import { getDbUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export const metadata = { title: "Manage Courts" };

export default async function ManageCourtsPage() {
  await requireRole("COURT_MANAGER", "ADMIN");
  const me = await getDbUser();
  if (!me) return null;

  const profile = await db.courtManagerProfile.findUnique({ where: { userId: me.id }, include: { courts: true } });

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Courts</h1>
        <Link href="/manage/courts/new" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">+ Add court</Link>
      </div>
      {profile?.courts.length === 0 && <p className="text-gray-500">No courts yet.</p>}
      <ul className="flex flex-col gap-4">
        {profile?.courts.map(c => (
          <li key={c.id} className="border rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-gray-500 text-sm">{c.city} · ${c.pricePerHour}/hr · {c.active ? "Active" : "Inactive"}</p>
            </div>
            <Link href={`/manage/courts/${c.id}`} className="text-green-600 text-sm hover:underline">Edit</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
