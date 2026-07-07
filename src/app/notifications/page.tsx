import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import MarkReadButton from "./mark-read-button";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <MarkReadButton />
      </div>
      {notifications.length === 0 && <p className="text-gray-500">No notifications.</p>}
      <ul className="flex flex-col gap-2">
        {notifications.map(n => (
          <li key={n.id} className={`border rounded-xl px-4 py-3 ${!n.read ? "bg-green-50 border-green-200 dark:bg-green-900/20" : "bg-white dark:bg-gray-900"}`}>
            {n.href ? <Link href={n.href} className="hover:text-green-600">{n.body}</Link> : <span>{n.body}</span>}
            <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
