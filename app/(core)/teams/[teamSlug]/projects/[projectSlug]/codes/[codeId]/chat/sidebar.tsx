"use client";

import { chatActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { DefaultChatsQuery } from "@/utils/query-params";
import { useQuery } from "@tanstack/react-query";
import { Archive, Plus } from "lucide-react";
import { useMemo } from "react";

interface SidebarProps {
  teamSlug: string;
  query: typeof DefaultChatsQuery;
  projectSlug: string;
  selectedChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  isCreatingChat: boolean;
  canCreateChat: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  teamSlug,
  query,
  selectedChatId,
  onChatSelect,
  onNewChat,
  isCreatingChat,
  canCreateChat,
}) => {
  const chatsQuery = useQuery({
    queryKey: generateQueryKey.chats(teamSlug, query),
    queryFn: () => chatActions.getChats(teamSlug, query),
  });

  const chats = useMemo(() => chatsQuery.data?.results ?? [], [chatsQuery.data?.results]);

  return (
    <aside className="w-72 shrink-0 flex flex-col bg-background gap-6">
      <div className="p-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start"
          onClick={onNewChat}
          disabled={isCreatingChat || !canCreateChat}
        >
          <Plus />
          New
        </Button>
      </div>
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-2">
          {chatsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          ) : chats.length > 0 ? (
            <div className="flex flex-col gap-2">
              {chats.map((chat) => (
                <Button
                  key={chat.id}
                  onClick={() => onChatSelect(chat.id)}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-between",
                    chat.id === selectedChatId && "text-accent-foreground bg-accent/50",
                  )}
                >
                  Chat #{chat.id.slice(-6)}
                  <Archive />
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-sm text-muted-foreground">No chats yet</div>
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};
