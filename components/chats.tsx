import { Skeleton } from "@/components/ui/skeleton";
import { ChatIndex, ChatSchema, ChatType } from "@/types/api/responses/chat";
import { formatDate } from "@/utils/helpers";
import { BotMessageSquare } from "lucide-react";
import Link from "next/link";
import React from "react";

const chatTypeLabel: Record<ChatType, string> = {
  code: "Code chat",
  analysis: "Analysis chat",
};

const getChatRoute = (chat: ChatIndex): string | null => {
  const teamSlug = chat.team.slug;
  const projectSlug = chat.project.slug;
  if (chat.chat_type === "analysis") {
    if (!chat.analysis_id) return null;
    return `/team/${teamSlug}/${projectSlug}/analyses/${chat.analysis_id}?chatId=${chat.id}`;
  }
  return `/team/${teamSlug}/${projectSlug}/codes/${chat.code_version_id}?chatId=${chat.id}`;
};

const chatDisplayTitle = (chat: ChatSchema): string => {
  const t = chat.title?.trim();
  if (t) return t;
  return "Untitled chat";
};

const ChatList: React.FC<{
  chats: ChatIndex[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  showHeader?: boolean;
}> = ({
  chats,
  isLoading = false,
  emptyMessage = "No chats in this project yet.",
  className,
  showHeader = true,
}) => {
  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center gap-2 mb-2">
          <BotMessageSquare className="size-4" />
          <h3 className="text-lg font-semibold">My Recent chats</h3>
        </div>
      )}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : chats.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div>
          {chats.map((chat) => {
            const route = getChatRoute(chat);
            const title = chatDisplayTitle(chat);
            const typeHint = chatTypeLabel[chat.chat_type];

            return (
              <div
                key={chat.id}
                className="flex items-center gap-2 py-2 text-sm text-muted-foreground whitespace-nowrap"
              >
                <span className="truncate">
                  {route ? (
                    <Link href={route} className="text-foreground/80 font-medium" title={typeHint}>
                      {title}
                    </Link>
                  ) : (
                    <span className="text-foreground/80 font-medium" title={typeHint}>
                      {title}
                    </span>
                  )}
                  {" · "}
                  {chat.total_messages} message{chat.total_messages !== 1 ? "s" : ""}
                  {" · "}
                  {formatDate(chat.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatList;
