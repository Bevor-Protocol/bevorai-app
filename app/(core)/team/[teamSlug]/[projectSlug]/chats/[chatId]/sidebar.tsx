"use client";

import { chatActions, codeActions } from "@/actions/bevor";
import { AnalysisVersionPreviewElement } from "@/components/analysis/element";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { CodeVersionCompactElement } from "@/components/versions/element";
import { cn } from "@/lib/utils";
import { SSEPayload, useSSE } from "@/providers/sse";
import { generateQueryKey } from "@/utils/constants";
import { DefaultChatsQuery } from "@/utils/query-params";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface SidebarProps {
  teamSlug: string;
  projectSlug: string;
  query: typeof DefaultChatsQuery;
  chatId: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ teamSlug, projectSlug, query, chatId }) => {
  const [isPromptHidden, setIsPromptHidden] = useState(false);
  const [isAnalysisPromptHidden, setIsAnalysisPromptHidden] = useState(false);
  const [newAnalysisNodeId, setNewAnalysisNodeId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { registerCallback } = useSSE();

  useEffect(() => {
    const unregister = registerCallback("analysis", "chat", chatId, (payload: SSEPayload) => {
      setNewAnalysisNodeId(payload.id);
    });

    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  const chatsQuery = useQuery({
    queryKey: generateQueryKey.chats(teamSlug, query),
    queryFn: () =>
      chatActions.getChats(teamSlug, query).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const chatQuery = useSuspenseQuery({
    queryKey: generateQueryKey.chat(chatId),
    queryFn: () =>
      chatActions.getChat(teamSlug, chatId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const relationQuery = useQuery({
    queryKey: generateQueryKey.codeRelations(chatQuery.data.code_version_id),
    queryFn: () =>
      codeActions.getRelations(teamSlug, chatQuery.data.code_version_id).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const createChatMutation = useMutation({
    mutationFn: async (codeId: string) =>
      chatActions
        .initiateChat(teamSlug, {
          chat_type: "code",
          code_version_id: codeId,
        })
        .then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    onSuccess: ({ id, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      router.push(`/team/${teamSlug}/${projectSlug}/chats/${id}`);
    },
    onError: () => {
      toast.error("Failed to create chat");
    },
  });

  useEffect(() => {
    if (chatQuery.data?.analysis_node_id && newAnalysisNodeId === chatQuery.data.analysis_node_id) {
      setNewAnalysisNodeId(null);
    }
  }, [chatQuery.data?.analysis_node_id, newAnalysisNodeId]);

  const newCodeVersion = useMemo(() => {
    if (!chatsQuery.data || !relationQuery.data) return;
    if (!relationQuery.data.children.length) return;
    const firstChild = relationQuery.data.children[0];
    const chatWithCode = chatsQuery.data.results.find(
      (chat) => chat.code_version_id == firstChild.id,
    );
    return {
      code_mapping_id: firstChild.id,
      chat_id: chatWithCode?.id,
    };
  }, [chatsQuery.data, relationQuery.data]);

  return (
    <aside className="w-72 shrink-0 flex flex-col bg-background gap-6 relative">
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-2">
          {chatsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          ) : (chatsQuery.data?.results.length ?? 0) > 0 ? (
            <div className="flex flex-col gap-2">
              {chatsQuery.data?.results.map((chat) => (
                <Button
                  key={chat.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-between",
                    chat.id === chatId && "text-accent-foreground bg-accent/50",
                  )}
                  asChild
                >
                  <Link href={`/team/${teamSlug}/${projectSlug}/chats/${chat.id}`}>
                    Chat #{chat.id.slice(-6)}
                  </Link>
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
      {chatQuery.data && (
        <div>
          <span className="text-xs text-muted-foreground uppercase block my-2">
            Current Context
          </span>
          <div className="space-y-2">
            <Link
              href={`/team/${teamSlug}/${projectSlug}/codes/${chatQuery.data.code_version_id}`}
              className="block hover:opacity-80 transition-opacity"
            >
              <CodeVersionCompactElement version={chatQuery.data.code_version} />
            </Link>
            {chatQuery.data.analysis && (
              <Link
                href={`/team/${teamSlug}/${projectSlug}/analyses/${chatQuery.data.analysis_node_id}`}
                className="block hover:opacity-80 transition-opacity"
              >
                <AnalysisVersionPreviewElement analysisVersion={chatQuery.data.analysis} />
              </Link>
            )}
          </div>
        </div>
      )}
      <div className="absolute bottom-0 right-0 w-72 space-y-2">
        {newAnalysisNodeId && !isAnalysisPromptHidden && (
          <div className="border py-2 px-4 text-sm rounded bg-background items-center space-y-2">
            <div className="flex justify-between items-start">
              <span>New analysis available</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsAnalysisPromptHidden(true)}
                className="size-4 self-start"
              >
                <X className="size-3 text-muted-foreground" />
              </Button>
            </div>
            <Button size="sm" className="text-xs h-7" asChild>
              <Link href={`/team/${teamSlug}/${projectSlug}/analyses/${newAnalysisNodeId}`}>
                View Analysis
              </Link>
            </Button>
          </div>
        )}
        {!!newCodeVersion && !isPromptHidden && (
          <div className="border py-2 px-4 text-sm rounded bg-background items-center space-y-2">
            <div className="flex justify-between items-start">
              <span>New code version available</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsPromptHidden(true)}
                className="size-4 self-start"
              >
                <X className="size-3 text-muted-foreground" />
              </Button>
            </div>
            {newCodeVersion.chat_id ? (
              <Button size="sm" className="text-xs h-7" asChild>
                <Link href={`/team/${teamSlug}/${projectSlug}/chats/${newCodeVersion.chat_id}`}>
                  Go to Chat
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                className="text-xs h-7"
                onClick={() => createChatMutation.mutate(newCodeVersion.code_mapping_id)}
                disabled={createChatMutation.isPending}
              >
                {createChatMutation.isPending ? "Starting..." : "Start new chat"}
              </Button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
