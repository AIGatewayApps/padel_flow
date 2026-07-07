import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import ChatBox from "./chat-box";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const member = await db.conversationMember.findUnique({ where: { conversationId_userId: { conversationId: id, userId } } });
  if (!member) notFound();

  const messages = await db.message.findMany({
    where: { conversationId: id },
    include: { sender: true },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const otherMembers = await db.conversationMember.findMany({ where: { conversationId: id, NOT: { userId } }, include: { conversation: true } });
  const otherIds = otherMembers.map(m => m.userId);
  const others = await db.user.findMany({ where: { id: { in: otherIds } }, select: { displayName: true, avatarUrl: true } });

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 border-b pb-4 mb-4">
        {others[0]?.avatarUrl && <Image src={others[0].avatarUrl} alt={others[0].displayName} width={36} height={36} className="rounded-full" />}
        <h1 className="font-semibold">{others.map(o => o.displayName).join(", ")}</h1>
      </div>
      <ChatBox conversationId={id} initialMessages={messages.map(m => ({ id: m.id, body: m.body, senderId: m.senderId, senderName: m.sender.displayName, senderAvatar: m.sender.avatarUrl, createdAt: m.createdAt.toISOString() }))} currentUserId={userId} />
    </div>
  );
}
