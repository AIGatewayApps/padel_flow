import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import NewConversation from "./new-conversation";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const memberships = await db.conversationMember.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
          members: { include: { conversation: { include: { members: { include: { conversation: true } } } } } },
        },
      },
    },
    orderBy: { conversation: { createdAt: "desc" } },
  });

  // Get other members' user info
  const convos = await Promise.all(memberships.map(async m => {
    const otherMembers = await db.conversationMember.findMany({
      where: { conversationId: m.conversationId, NOT: { userId } },
      include: { conversation: true },
    });
    const otherIds = otherMembers.map(om => om.userId);
    const others = await db.user.findMany({ where: { id: { in: otherIds } }, select: { id: true, displayName: true, avatarUrl: true, username: true } });
    return { conversation: m.conversation, others, lastMessage: m.conversation.messages[0] ?? null };
  }));

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Messages</h1>
        <NewConversation currentUserId={userId} />
      </div>
      {convos.length === 0 && <p className="text-gray-500">No conversations yet. Start one above.</p>}
      <ul className="flex flex-col gap-2">
        {convos.map(({ conversation, others, lastMessage }) => (
          <li key={conversation.id}>
            <Link href={`/messages/${conversation.id}`}
              className="flex items-center gap-4 bg-white dark:bg-gray-900 border rounded-xl px-4 py-3 hover:border-green-400 transition">
              {others[0]?.avatarUrl && <Image src={others[0].avatarUrl} alt={others[0].displayName} width={40} height={40} className="rounded-full" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{others.map(o => o.displayName).join(", ") || "Conversation"}</p>
                {lastMessage && <p className="text-sm text-gray-400 truncate">{lastMessage.body}</p>}
              </div>
              {lastMessage && <span className="text-xs text-gray-400 shrink-0">{new Date(lastMessage.createdAt).toLocaleDateString()}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
