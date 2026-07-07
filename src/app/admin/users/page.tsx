import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Admin — Users" };

export default async function AdminUsersPage() {
  await requireRole("ADMIN");
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Admin</Link>
        <h1 className="text-2xl font-bold">Users ({users.length})</h1>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 dark:bg-gray-800">
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {u.avatarUrl && <Image src={u.avatarUrl} alt={u.displayName} width={28} height={28} className="rounded-full" />}
                    <span className="font-medium">{u.displayName}</span>
                    <span className="text-gray-400">@{u.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === "ADMIN" ? "bg-red-100 text-red-700" : u.role === "COURT_MANAGER" ? "bg-blue-100 text-blue-700" : u.role === "EVENT_MANAGER" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
