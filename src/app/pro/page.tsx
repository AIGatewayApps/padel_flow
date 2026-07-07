import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ClerkProButton from "./clerk-pro-button";

export const metadata = { title: "PadelFlow Pro" };

const FEATURES = [
  { emoji: "📊", label: "Advanced match stats & win rate charts" },
  { emoji: "🧠", label: "AI opponent suggestions based on your Elo" },
  { emoji: "📳", label: "Push notifications for match challenges" },
  { emoji: "🎯", label: "Priority court booking — reserve up to 2 weeks out" },
  { emoji: "📅", label: "Recurring weekly bookings" },
  { emoji: "👑", label: "Pro badge on your profile" },
  { emoji: "🔒", label: "Private club creation (unlimited members)" },
  { emoji: "🎬", label: "Video session booking with coaches" },
];

export default async function ProPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await db.user.findUnique({ where: { id: userId }, select: { subscription: true, displayName: true } });
  const isPro = user?.subscription === "PRO";

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-0 flex flex-col gap-8">
      <div className="text-center">
        <div className="text-5xl mb-4">👑</div>
        <h1 className="text-3xl font-bold">PadelFlow Pro</h1>
        <p className="text-gray-500 mt-2">{isPro ? `You are a Pro member, ${user?.displayName}!` : "Level up your game"}</p>
      </div>

      {isPro ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
          <p className="text-green-700 dark:text-green-300 font-semibold">✓ Active Pro subscription</p>
          <p className="text-sm text-gray-500 mt-1">All Pro features are unlocked. Manage your subscription in your account settings.</p>
        </div>
      ) : (
        <div className="border rounded-2xl p-6 bg-white dark:bg-gray-900 text-center">
          <p className="text-4xl font-bold">$9<span className="text-xl text-gray-400 font-normal">/mo</span></p>
          <p className="text-gray-500 text-sm mt-1">or $79/year — save 27%</p>
          <ClerkProButton />
          <p className="text-xs text-gray-400 mt-3">Cancel anytime. Billed securely via Clerk Billing.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold">What is included</h2>
        {FEATURES.map(f => (
          <div key={f.label} className="flex items-start gap-3">
            <span className="text-xl shrink-0">{f.emoji}</span>
            <p className="text-sm text-gray-700 dark:text-gray-300">{f.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
