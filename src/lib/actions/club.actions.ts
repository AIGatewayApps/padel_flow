"use server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { z } from "zod";

const ClubSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
});

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

export async function joinClub(inviteCode: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const club = await db.club.findUnique({ where: { inviteCode } });
  if (!club) throw new Error("Invalid invite code");
  await db.clubMember.upsert({
    where: { clubId_userId: { clubId: club.id, userId } },
    create: { clubId: club.id, userId },
    update: {},
  });
  revalidatePath("/clubs");
  redirect(`/clubs/${club.id}`);
}

export async function postToClub(clubId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const member = await db.clubMember.findUnique({ where: { clubId_userId: { clubId, userId } } });
  if (!member) throw new Error("Not a member");
  const body = formData.get("body")?.toString().trim();
  if (!body || body.length === 0) throw new Error("Empty post");
  await db.clubPost.create({ data: { clubId, authorId: userId, body } });
  revalidatePath(`/clubs/${clubId}`);
}
