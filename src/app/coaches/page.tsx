import { db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import HireButton from "./hire-button";
import { auth } from "@clerk/nextjs/server";

export const metadata = { title: "Coaches" };

export default async function CoachesPage() {
  const { userId } = await auth();
  const coaches = await db.coach.findMany({
    where: { active: true },
    include: { user: true },
    orderBy: { pricePerHour: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Find a Coach</h1>
      {coaches.length === 0 && <p className="text-gray-500">No coaches available yet.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {coaches.map(coach => (
          <div key={coach.id} className="bg-white dark:bg-gray-900 border rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {coach.user.avatarUrl && <Image src={coach.user.avatarUrl} alt={coach.user.displayName} width={48} height={48} className="rounded-full" />}
              <div>
                <Link href={`/players/${coach.user.username}`} className="font-semibold hover:text-green-600">{coach.user.displayName}</Link>
                <p className="text-green-600 font-medium text-sm">${coach.pricePerHour}/hr</p>
              </div>
            </div>
            {coach.bio && <p className="text-sm text-gray-600 dark:text-gray-400">{coach.bio}</p>}
            {coach.certifications && <p className="text-xs text-gray-400">🎓 {coach.certifications}</p>}
            {userId && userId !== coach.userId && <HireButton coachId={coach.id} pricePerHour={coach.pricePerHour} />}
          </div>
        ))}
      </div>
    </div>
  );
}
