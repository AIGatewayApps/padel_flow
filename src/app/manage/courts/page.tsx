import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireOrgRole } from "@/lib/permissions";
import Link from "next/link";

export const metadata = { title: "Manage Courts" };

export default async function ManageCourtsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const membership = await db.orgMember.findFirst({
    where: { user: { clerkId: userId }, role: "ORG_ADMIN" },
    select: { orgId: true },
  });
  if (!membership) redirect("/dashboard");

  await requireOrgRole(userId, membership.orgId, ["ORG_ADMIN"]);

  const courts = await db.court.findMany({
    where: { orgId: membership.orgId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Courts</h1>
        <Link href="/manage/courts/new" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">+ Add court</Link>
      </div>
      {courts.length === 0 && <p className="text-gray-500">No courts yet.</p>}
      <ul className="flex flex-col gap-4">
        {courts.map(c => (
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
