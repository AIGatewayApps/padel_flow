import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { markAllNotificationsRead } from "@/lib/actions/notification.actions";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unread > 0 && <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">{unread}</span>}
        </div>
        {unread > 0 && (
          <form action={markAllNotificationsRead}>
            <button className="text-sm text-green-600 hover:underline">Mark all read</button>
          </form>
        )}
      </div>
      {notifications.length === 0 && <p className="text-gray-400 text-center py-16">No notifications yet.</p>}
      <ul className="flex flex-col gap-2">
        {notifications.map(n => (
          <li key={n.id} className={`border rounded-2xl px-4 py-3 transition-colors ${
            !n.read ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
          }`}>
            {n.href
              ? <Link href={n.href} className="hover:text-green-600 transition-colors font-medium text-sm">{n.body}</Link>
              : <span className="font-medium text-sm">{n.body}</span>}
            <p className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
