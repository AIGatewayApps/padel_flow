import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function getDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  return db.user.findUnique({
    where: { clerkId: userId },
  });
}

export async function requireDbUser() {
  const user = await getDbUser();
  if (!user) throw new Error("User not found in database");
  return user;
}

export async function syncClerkUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  return db.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      name:
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
        null,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      avatarUrl: clerkUser.imageUrl,
    },
    create: {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      name:
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
        null,
      avatarUrl: clerkUser.imageUrl,
    },
  });
}
