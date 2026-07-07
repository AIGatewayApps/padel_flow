import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import RealtimeChatBox from "./realtime-chat-box";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const member = await db.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: id, userId } },
  });
  if (!member) notFound();

  const [messages, otherMembers] = await Promise.all([
    db.message.findMany({
      where: { conversationId: id },
      include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    db.conversationMember.findMany({
      where: { conversationId: id, NOT: { userId } },
      include: { user: { select: { displayName: true, avatarUrl: true, username: true } } },
    }),
  ]);

  const others = otherMembers.map(m => m.user);

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-5rem)] px-4 sm:px-0">
      <div className="flex items-center gap-3 border-b pb-4 mb-4 shrink-0">
        {others[0]?.avatarUrl
          ? <Image src={others[0].avatarUrl} alt={others[0].displayName} width={36} height={36} className="rounded-full" />
          : <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700">{others[0]?.displayName[0]}</div>}
        <h1 className="font-semibold">{others.map(o => o.displayName).join(", ")}</h1>
      </div>
      <RealtimeChatBox
        conversationId={id}
        initialMessages={messages.map(m => ({
          id: m.id, body: m.body, senderId: m.senderId,
          senderName: m.sender.displayName, senderAvatar: m.sender.avatarUrl,
          createdAt: m.createdAt.toISOString(),
        }))}
        currentUserId={userId}
      />
    </div>
  );
}
