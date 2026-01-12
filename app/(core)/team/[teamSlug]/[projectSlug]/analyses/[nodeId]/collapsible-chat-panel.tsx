"use client";

import { analysisActions, chatActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { extractChatsQuery } from "@/utils/query-params";
import { FindingSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { MessageSquare, Settings, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChatMessages } from "../../chats/[chatId]/chat-messages";

interface CollapsibleChatPanelProps {
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
  findingContext: FindingSchemaI[];
  onRemoveFindingFromContext: (findingId: string) => void;
}

const CHAT_PANEL_STORAGE_KEY = "analysis-chat-panel-expanded";
const CHAT_PANEL_WIDTH = "24rem";

const CollapsibleChatPanel: React.FC<CollapsibleChatPanelProps> = ({
  teamSlug,
  projectSlug,
  nodeId,
  findingContext,
  onRemoveFindingFromContext,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const chatIdFromUrl = searchParams.get("chatId");
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(CHAT_PANEL_STORAGE_KEY);
    return stored ? stored === "true" : !!chatIdFromUrl;
  });
  const [selectedChatId, setSelectedChatId] = useState<string | null>(chatIdFromUrl);
  const [isChatsPopoverOpen, setIsChatsPopoverOpen] = useState(false);

  const { data: version } = useSuspenseQuery({
    queryKey: generateQueryKey.analysisDetailed(nodeId),
    queryFn: () =>
      analysisActions.getAnalysisDetailed(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const chatQuery = extractChatsQuery({
    project_slug: projectSlug,
    code_version_id: version.code_version_id,
    analysis_node_id: version.id,
    chat_type: "analysis",
  });

  const chatsQuery = useQuery({
    queryKey: generateQueryKey.chats(teamSlug, chatQuery),
    queryFn: () =>
      chatActions.getChats(teamSlug, chatQuery).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  useEffect(() => {
    if (chatIdFromUrl !== selectedChatId) {
      setSelectedChatId(chatIdFromUrl);
      if (chatIdFromUrl) {
        setIsExpanded(true);
      }
    }
  }, [chatIdFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem(CHAT_PANEL_STORAGE_KEY, String(isExpanded));
  }, [isExpanded]);

  const createChatMutation = useMutation({
    mutationFn: async () =>
      chatActions
        .initiateChat(teamSlug, {
          chat_type: "analysis",
          code_version_id: version.code_version_id,
          analysis_node_id: version.id,
        })
        .then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    onSuccess: ({ id, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setSelectedChatId(id);
      setIsExpanded(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set("chatId", id);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    onError: () => {
      toast.error("Failed to create chat");
    },
  });

  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      if (e.key === "l" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsExpanded((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return (): void => document.removeEventListener("keydown", down);
  }, []);

  const handleChatSelect = (chatId: string): void => {
    setSelectedChatId(chatId);
    setIsExpanded(true);
    setIsChatsPopoverOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("chatId", chatId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCreateChat = (): void => {
    createChatMutation.mutate();
  };

  if (!isExpanded) {
    return (
      <aside
        className="flex flex-col items-center justify-center min-h-0 bg-background border rounded-lg"
        style={{ width: "3rem" }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded((prev) => !prev)}
          title="Expand chat"
          className="size-full flex flex-col gap-2"
        >
          <MessageSquare className="size-4 text-muted-foreground" />
          <KbdGroup>
            <Kbd>⌘ + L</Kbd>
          </KbdGroup>
        </Button>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col min-h-0 pr-2 bg-background" style={{ width: CHAT_PANEL_WIDTH }}>
      <div className="flex items-center justify-end gap-1 p-2">
        <Popover open={isChatsPopoverOpen} onOpenChange={setIsChatsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" title="Show other chats">
              <Settings className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-2">
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Chats</div>
              {chatsQuery.isLoading ? (
                <div className="space-y-1">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-full" />
                  ))}
                </div>
              ) : chatsQuery.data?.results.length ? (
                <ScrollArea className="max-h-64">
                  <div className="space-y-1">
                    {chatsQuery.data.results.map((chat) => (
                      <Button
                        key={chat.id}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start",
                          chat.id === selectedChatId && "bg-accent text-accent-foreground",
                        )}
                        onClick={() => handleChatSelect(chat.id)}
                      >
                        Chat #{chat.id.slice(-6)}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No chats yet
                </div>
              )}
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setIsChatsPopoverOpen(false);
                    handleCreateChat();
                  }}
                  disabled={createChatMutation.isPending}
                >
                  {createChatMutation.isPending ? "Creating..." : "New Chat"}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsExpanded((prev) => !prev)}
          title="Collapse chat"
        >
          <X className="size-4" />
        </Button>
      </div>

      {selectedChatId ? (
        <div className="flex-1 min-h-0 min-w-0 flex flex-col">
          <ChatMessages
            teamSlug={teamSlug}
            chatId={selectedChatId}
            fullWidth
            findingContext={findingContext}
            onRemoveFindingFromContext={onRemoveFindingFromContext}
          />
        </div>
      ) : (
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4">
            {chatsQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-8 w-full" />
                ))}
              </div>
            ) : chatsQuery.data?.results.length ? (
              <div className="space-y-2">
                {chatsQuery.data.results.map((chat) => (
                  <Button
                    key={chat.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleChatSelect(chat.id)}
                  >
                    Chat #{chat.id.slice(-6)}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={handleCreateChat}
                  disabled={createChatMutation.isPending}
                >
                  {createChatMutation.isPending ? "Creating..." : "New Chat"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <MessageSquare className="size-12 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">No chats yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start a conversation about this analysis
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateChat}
                  disabled={createChatMutation.isPending}
                >
                  {createChatMutation.isPending ? "Creating..." : "Start Chat"}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </aside>
  );
};

export default CollapsibleChatPanel;
