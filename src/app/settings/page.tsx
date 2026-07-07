import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import SettingsForm from "./settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { settings: true },
  });
  if (!user) redirect("/onboarding");

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <SettingsForm user={user} settings={user.settings} />
    </main>
  );
}
