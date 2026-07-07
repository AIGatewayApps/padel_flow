import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import AvailabilityEditor from "./availability-editor";

export const metadata = { title: "Set Availability" };

export default async function AvailabilityPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const coach = await db.coach.findUnique({
    where: { userId },
    include: { availability: { orderBy: { dayOfWeek: "asc" } } },
  });
  if (!coach) redirect("/onboarding");
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <h1 className="text-2xl font-bold mb-8">Weekly availability</h1>
      <AvailabilityEditor coachId={coach.id} availability={coach.availability} />
    </div>
  );
}
