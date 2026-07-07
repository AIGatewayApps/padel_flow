import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Already onboarded?
  const user = await db.user.findUnique({ where: { id: userId } });
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6">Welcome to PadelFlow</h1>
        <p className="text-gray-500 mb-8">Tell us a bit about yourself to get started.</p>
        <OnboardingForm />
      </div>
    </main>
  );
}
