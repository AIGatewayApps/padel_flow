import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import OnboardingFlow from "./onboarding-flow";

export const metadata = { title: "Welcome to PadelFlow" };

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { onboarded: true, role: true, displayName: true },
  });
  if (user?.onboarded) redirect("/dashboard");
  return <OnboardingFlow role={user?.role ?? "PLAYER"} displayName={user?.displayName ?? ""} />;
}
