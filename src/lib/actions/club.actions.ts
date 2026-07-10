"use server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { postRatelimit } from "@/lib/ratelimit";
import { z } from "zod";
import type { ActionResult } from "@/lib/types";

const MAX_CLUB_MEMBERS = 200;

const ClubSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
});

const PostSchema = z.object({
  body: z.string().min(1).max(2000),
});

async function resolveDbUser(clerkId: string) {
  return db.user.findUnique({ where: { clerkId }, select: { id: true } });
}

export async function createClub(formData: FormData): Promise<ActionResult<string>> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const dbUser = await resolveDbUser(clerkId);
  if (!dbUser) return { success: false, error: "User not found", code: "NOT_FOUND" };

  const result = ClubSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    city: formData.get("city") || undefined,
  });
  if (!result.success)
    return {
      success: false,
      error: result.error.errors[0]?.message ?? "Invalid input",
      code: "VALIDATION_ERROR",
    };

  // Atomic: create club + owner membership in one transaction
  const club = await db.$transaction(async (tx) => {
    const c = await tx.club.create({
      data: {
        ...result.data,
        ownerId: dbUser.id,
      },
    });
    await tx.clubMember.create({ data: { clubId: c.id, userId: dbUser.id, role: "owner" } });
    return c;
  });

  revalidatePath("/clubs");
  redirect(`/clubs/${club.id}`);
}

export async function joinClub(inviteCode: string): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const dbUser = await resolveDbUser(clerkId);
  if (!dbUser) return { success: false, error: "User not found", code: "NOT_FOUND" };

  const club = await db.club.findUnique({
    where: { inviteCode },
    include: { _count: { select: { members: true } } },
  });
  if (!club) return { success: false, error: "Invalid invite code", code: "INVALID_CODE" };

  if (club._count.members >= MAX_CLUB_MEMBERS)
    return { success: false, error: "This club is full", code: "CLUB_FULL" };

  await db.clubMember.upsert({
    where: { clubId_userId: { clubId: club.id, userId: dbUser.id } },
    create: { clubId: club.id, userId: dbUser.id },
    update: {},
  });

  revalidatePath("/clubs");
  redirect(`/clubs/${club.id}`);
}

export async function postToClub(
  clubId: string,
  formData: FormData
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  if (postRatelimit) {
    const { success } = await postRatelimit.limit(clerkId);
    if (!success)
      return { success: false, error: "Too many posts. Please slow down.", code: "RATE_LIMITED" };
  }

  const dbUser = await resolveDbUser(clerkId);
  if (!dbUser) return { success: false, error: "User not found", code: "NOT_FOUND" };

  const member = await db.clubMember.findUnique({
    where: { clubId_userId: { clubId, userId: dbUser.id } },
  });
  if (!member) return { success: false, error: "Not a member", code: "NOT_MEMBER" };

  const result = PostSchema.safeParse({ body: formData.get("body")?.toString().trim() });
  if (!result.success)
    return {
      success: false,
      error: result.error.errors[0]?.message ?? "Invalid input",
      code: "VALIDATION_ERROR",
    };

  await db.clubPost.create({
    data: { clubId, authorId: dbUser.id, body: result.data.body },
  });

  revalidatePath(`/clubs/${clubId}`);
  return { success: true, data: undefined };
}
