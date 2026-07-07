"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function createVideoSession(coachHireId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const hire = await db.coachHire.findUnique({
    where: { id: coachHireId },
    include: { coach: { select: { userId: true } } },
  });
  if (!hire) throw new Error("Not found");
  if (hire.coach.userId !== userId && hire.studentId !== userId) throw new Error("Forbidden");

  const res = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `padelflow-${coachHireId}`,
      privacy: "private",
      properties: { enable_chat: true, start_video_off: false, start_audio_off: false },
      exp: Math.floor(hire.scheduledAt.getTime() / 1000) + 3600,
    }),
  });

  if (!res.ok) throw new Error("Failed to create video room");
  const room = await res.json() as { url: string; name: string };

  revalidatePath(`/coach-portal`);
  return { url: room.url, roomName: room.name };
}

export async function getVideoUrl(coachHireId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const hire = await db.coachHire.findUnique({
    where: { id: coachHireId },
    include: { coach: { select: { userId: true } } },
  });
  if (!hire) throw new Error("Not found");
  if (hire.coach.userId !== userId && hire.studentId !== userId) throw new Error("Forbidden");

  const res = await fetch(`https://api.daily.co/v1/rooms/padelflow-${coachHireId}`, {
    headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` },
  });

  if (!res.ok) {
    return createVideoSession(coachHireId);
  }
  const room = await res.json() as { url: string };
  return { url: room.url, roomName: `padelflow-${coachHireId}` };
}
