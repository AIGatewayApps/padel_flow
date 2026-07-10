"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/types";

const ROOM_DURATION_S = 3600;

async function assertHireAccess(coachHireId: string, clerkId: string) {
  const hire = await db.coachHire.findUnique({
    where: { id: coachHireId },
    include: { coach: { select: { userId: true } } },
  });
  if (!hire) return { hire: null, error: "Not found" } as const;

  const dbUser = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!dbUser) return { hire: null, error: "User not found" } as const;

  const isCoach = hire.coach.userId === clerkId;
  const isStudent = hire.studentId === dbUser.id;
  if (!isCoach && !isStudent) return { hire: null, error: "Forbidden" } as const;

  return { hire, dbUser, error: null } as const;
}

export async function createVideoSession(
  coachHireId: string
): Promise<ActionResult<{ url: string; roomName: string }>> {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const access = await assertHireAccess(coachHireId, clerkId);
  if (access.error)
    return { success: false, error: access.error, code: "FORBIDDEN" };

  const { hire } = access;

  // Prevent creating a room for a session that is already in the past
  const expiry = Math.floor(hire.scheduledAt.getTime() / 1000) + ROOM_DURATION_S;
  if (expiry < Math.floor(Date.now() / 1000))
    return { success: false, error: "Session has already ended", code: "GONE" };

  const res = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `padelflow-${coachHireId}`,
      privacy: "private",
      properties: {
        enable_chat: true,
        start_video_off: false,
        start_audio_off: false,
        exp: expiry,
      },
    }),
  });

  if (!res.ok)
    return { success: false, error: "Failed to create video room", code: "UPSTREAM_ERROR" };

  const room = (await res.json()) as { url: string; name: string };
  revalidatePath("/coach-portal");
  return { success: true, data: { url: room.url, roomName: room.name } };
}

export async function getVideoUrl(
  coachHireId: string
): Promise<ActionResult<{ url: string; roomName: string }>> {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };

  const access = await assertHireAccess(coachHireId, clerkId);
  if (access.error)
    return { success: false, error: access.error, code: "FORBIDDEN" };

  const res = await fetch(
    `https://api.daily.co/v1/rooms/padelflow-${coachHireId}`,
    { headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` } }
  );

  if (res.status === 404) return createVideoSession(coachHireId);
  if (!res.ok)
    return { success: false, error: "Failed to fetch video room", code: "UPSTREAM_ERROR" };

  const room = (await res.json()) as { url: string };
  return { success: true, data: { url: room.url, roomName: `padelflow-${coachHireId}` } };
}
