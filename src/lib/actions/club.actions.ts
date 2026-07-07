"use server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { z } from "zod";

const MAX_CLUB_MEMBERS = 200;

const ClubSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
});

const PostSchema = z.object({
  body: z.string().min(1).max(2000),
});

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export async function createClub(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = ClubSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    city: formData.get("city") || undefined,
  });

  const club = await db.club.create({
    data: {
      ...parsed,
      ownerId: userId,
      members: { create: { userId, role: "owner" } },
    },
  });

  revalidatePath("/clubs");
  redirect(`/clubs/${club.id}`);
}

export async function joinClub(
  inviteCode: string
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const club = await db.club.findUnique({
    where: { inviteCode },
    include: { _count: { select: { members: true } } },
  });

  if (!club)
    return { success: false, error: "Invalid invite code", code: "INVALID_CODE" };

  // Membership cap
  if (club._count.members >= MAX_CLUB_MEMBERS)
    return {
      success: false,
      error: "This club is full",
      code: "CLUB_FULL",
    };

  await db.clubMember.upsert({
    where: { clubId_userId: { clubId: club.id, userId } },
    create: { clubId: club.id, userId },
    update: {},
  });

  revalidatePath("/clubs");
  redirect(`/clubs/${club.id}`);
}

export async function postToClub(
  clubId: string,
  formData: FormData
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const member = await db.clubMember.findUnique({
    where: { clubId_userId: { clubId, userId } },
  });
  if (!member)
    return { success: false, error: "Not a member", code: "NOT_MEMBER" };

  const result = PostSchema.safeParse({ body: formData.get("body")?.toString().trim() });
  if (!result.success)
    return {
      success: false,
      error: result.error.errors[0]?.message ?? "Invalid input",
      code: "VALIDATION_ERROR",
    };

  await db.clubPost.create({
    data: { clubId, authorId: userId, body: result.data.body },
  });

  revalidatePath(`/clubs/${clubId}`);
  return { success: true, data: undefined };
}
