import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import QrScanner from "./qr-scanner";

export const metadata = { title: "Scan Tickets" };

export default async function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const event = await db.event.findUnique({
    where: { id },
    include: {
      manager: { select: { userId: true } },
      tickets: { include: { user: { select: { displayName: true, avatarUrl: true } } } },
      _count: { select: { tickets: true } },
    },
  });
  if (!event) notFound();
  if (event.manager.userId !== userId) redirect("/dashboard");

  const scannedCount = event.tickets.filter(t => t.scanned).length;

  return (
    <div className="max-w-md mx-auto px-4 sm:px-0 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Scan Tickets</h1>
        <p className="text-gray-500 text-sm mt-1">{event.title}</p>
        <p className="text-sm mt-2">{scannedCount} / {event._count.tickets} scanned</p>
      </div>
      <QrScanner eventId={id} />
      <div className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Attendees</h2>
        {event.tickets.map(t => (
          <div key={t.id} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
            t.scanned ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
          }`}>
            <p className="text-sm font-medium">{t.user.displayName}</p>
            {t.scanned
              ? <span className="text-xs text-green-600 font-semibold">Scanned</span>
              : <span className="text-xs text-gray-400">Not yet</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
