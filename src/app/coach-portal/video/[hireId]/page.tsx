import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getVideoUrl } from "@/lib/actions/coach-video.actions";

export const metadata = { title: "Video Session" };

export default async function VideoSessionPage({ params }: { params: Promise<{ hireId: string }> }) {
  const { hireId } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const hire = await db.coachHire.findUnique({
    where: { id: hireId },
    include: { coach: { select: { userId: true, user: { select: { displayName: true } } } }, student: { select: { displayName: true } } },
  });
  if (!hire) notFound();
  if (hire.coach.userId !== userId && hire.studentId !== userId) redirect("/dashboard");

  let videoUrl: string | null = null;
  try {
    const result = await getVideoUrl(hireId);
    videoUrl = result.url;
  } catch {
    videoUrl = null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Video Session</h1>
        <span className="text-sm text-gray-400">{new Date(hire.scheduledAt).toLocaleString()}</span>
      </div>
      <p className="text-gray-500 text-sm">Coach {hire.coach.user.displayName} - {hire.student.displayName}</p>
      {videoUrl ? (
        <div className="flex flex-col gap-3">
          <a href={videoUrl} target="_blank" rel="noopener noreferrer"
            className="bg-green-600 text-white rounded-xl py-3 px-6 text-center font-semibold hover:bg-green-700">
            Join video session
          </a>
          <iframe src={videoUrl} allow="camera; microphone; fullscreen; display-capture" className="w-full aspect-video rounded-2xl border" />
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">Video</p>
          <p>Video session will be available 1 hour before your scheduled time.</p>
        </div>
      )}
    </div>
  );
}
