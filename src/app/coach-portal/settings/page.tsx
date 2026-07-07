import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { updateCoachProfile } from "@/lib/actions/coach.actions";

export const metadata = { title: "Coach Settings" };

export default async function CoachSettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const coach = await db.coach.findUnique({ where: { userId } });
  if (!coach) redirect("/onboarding");
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-0">
      <h1 className="text-2xl font-bold mb-8">Coach profile</h1>
      <form action={updateCoachProfile} className="flex flex-col gap-4">
        <textarea name="bio" defaultValue={coach.bio ?? ""} placeholder="Your bio..." rows={4}
          className="border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500" />
        <input name="pricePerHour" type="number" min="0" step="0.01" defaultValue={coach.pricePerHour}
          placeholder="Price per hour ($)" className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        <input name="certifications" defaultValue={coach.certifications ?? ""} placeholder="Certifications (e.g. WPT Level 2)"
          className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        <label className="flex items-center gap-3 text-sm cursor-pointer">
          <input type="checkbox" name="active" defaultChecked={coach.active} className="w-4 h-4 accent-green-600" />
          Accepting new bookings
        </label>
        <button type="submit" className="bg-green-600 text-white rounded-xl py-3 font-semibold hover:bg-green-700 transition-colors">
          Save changes
        </button>
      </form>
    </div>
  );
}
