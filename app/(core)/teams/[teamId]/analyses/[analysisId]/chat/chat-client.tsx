"use client";

import { chatActions } from "@/actions/bevor";
import { ChatInterface } from "@/app/(core)/teams/[teamId]/analyses/[analysisId]/chat/chat-interface";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { QUERY_KEYS } from "@/utils/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface ChatClientProps {
  teamId: string;
  analysisId: string;
}

const ChatClient: React.FC<ChatClientProps> = ({ teamId, analysisId }) => {
  const filter = {
    page: "0",
    page_size: "20",
    analysis_id: analysisId,
  };

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const chatsQuery = useQuery({
    queryKey: [QUERY_KEYS.CHATS, teamId, filter],
    queryFn: () => chatActions.getChats(teamId, filter),
  });

  const chats = useMemo(() => chatsQuery.data?.results ?? [], [chatsQuery.data?.results]);

  useEffect(() => {
    if (chats.length === 0) {
      setSelectedChatId(null);
      return;
    }

    if (!selectedChatId) {
      setSelectedChatId(chats[0].id);
      return;
    }

    const exists = chats.some((chat) => chat.id === selectedChatId);
    if (!exists) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, selectedChatId]);

  const createMutation = useMutation<string, unknown, void>({
    mutationFn: () => chatActions.initiateChat(teamId, analysisId),
    onSuccess: (chatId) => {
      toast.success("New chat created");
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHATS, teamId],
      });
      setSelectedChatId(chatId);
    },
    onError: () => {
      toast.error("Unable to create chat");
    },
  });

  return (
    <div className="flex gap-6 size-full">
      <div className="flex flex-col bg-background max-w-3xl m-auto grow min-h-0 size-full">
        <ChatInterface teamId={teamId} chatId={selectedChatId} />
      </div>
      <aside className="w-72 shrink-0 flex flex-col bg-background gap-6">
        <div className="p-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
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
                    onClick={() => setSelectedChatId(chat.id)}
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
    </div>
  );
};

export default ChatClient;
