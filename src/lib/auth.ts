import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import type { Role } from "@prisma/client";

/** Returns the current user's DB record, or null. */
export async function getDbUser() {
  const { userId } = await auth();
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId }, include: { settings: true } });
}

/** Throws if current role doesn't match. Use in Server Actions / Route Handlers. */
export async function requireRole(...roles: Role[]) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: Role })?.role;
  if (!role || !roles.includes(role)) throw new Error("Forbidden");
  return role;
}

/** Syncs a Clerk user into DB (called from webhook). */
export async function upsertUserFromClerk(clerkUserId: string) {
  const user = await currentUser();
  if (!user) return;
  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const role = ((user.publicMetadata as { role?: string })?.role ?? "PLAYER") as Role;
  await db.user.upsert({
    where: { id: clerkUserId },
    update: { email, displayName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(), avatarUrl: user.imageUrl, role },
    create: {
      id: clerkUserId,
      email,
      username: user.username ?? clerkUserId.slice(0, 16),
      displayName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      avatarUrl: user.imageUrl,
      role,
      settings: { create: {} }, // default settings
    },
  });
}
