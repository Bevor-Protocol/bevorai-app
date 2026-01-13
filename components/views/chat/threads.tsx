import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useChat } from "@/providers/chat";
import { ChatPaginationI } from "@/utils/types";
import { UseQueryResult } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import React from "react";

const ChatThreads: React.FC<{ chatsQuery: UseQueryResult<ChatPaginationI, Error> }> = ({
  chatsQuery,
}) => {
  const { selectedChatId, setSelectedChatId, setShowSettings, createChatMutation } = useChat();

  const handleSelect = (chatId: string): void => {
    setSelectedChatId(chatId);
    setShowSettings(false);
  };

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="px-2 py-3">
        <div className="px-2 mb-2 text-xs font-semibold text-muted-foreground">Chats</div>
        {chatsQuery.isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full rounded-md" />
            ))}
          </div>
        ) : chatsQuery.data?.results.length ? (
          <div className="space-y-1">
            {chatsQuery.data.results.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start font-normal rounded-md",
                  chat.id === selectedChatId && "bg-accent text-accent-foreground",
                )}
                onClick={() => handleSelect(chat.id)}
              >
                {chat.title ? chat.title : `chat #${chat.id.slice(-6)}`}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 rounded-md"
              onClick={() => createChatMutation.mutate()}
            >
              New Chat
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <MessageSquare className="size-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">No chats yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start a conversation about this code
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-md"
              onClick={() => createChatMutation.mutate()}
            >
              Start Chat
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default ChatThreads;
