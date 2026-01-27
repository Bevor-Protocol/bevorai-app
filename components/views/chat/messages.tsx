"use client";

import { chatActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import * as Chat from "@/components/ui/chat";
import { Loader } from "@/components/ui/loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useChat } from "@/providers/chat";
import { generateQueryKey } from "@/utils/constants";
import { ChatMessageI, FindingSchemaI } from "@/utils/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatInput } from "./chat-input";
import { ChatStreamingContent } from "./chat-streaming-content";

interface ChatMessagesProps {
  teamSlug: string;
  codeId: string;
  findingContext?: FindingSchemaI[];
  availableFindings?: FindingSchemaI[];
  maxWidth?: string;
  onRemoveFindingFromContext?: (findingId: string) => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  teamSlug,
  codeId,
  findingContext,
  availableFindings,
  maxWidth,
  onRemoveFindingFromContext,
}) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [currentEventType, setCurrentEventType] = useState("");
  const [streamedContent, setStreamedContent] = useState("");
  const [buffer, setBuffer] = useState("");
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [pendingApprovalId, setPendingApprovalId] = useState<string | null>(null);
  const [approvalContent, setApprovalContent] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);

  const { selectedChatId, isMaximized } = useChat();

  const chatMessageQuery = useQuery({
    queryKey: generateQueryKey.chatMessages(selectedChatId!),
    queryFn: () =>
      chatActions.getChatMessages(teamSlug, selectedChatId!).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: !!selectedChatId,
  });

  const chatQuery = useQuery({
    queryKey: generateQueryKey.chat(selectedChatId!),
    queryFn: () =>
      chatActions.getChat(teamSlug, selectedChatId!).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: !!selectedChatId,
  });

  const checkScrollPosition = useCallback((): void => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;
    if (!chatMessageQuery.data?.length) {
      setShowScrollToBottom(false);
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollToBottom(!isAtBottom && chatMessageQuery.data.length > 0);
  }, [chatMessageQuery.data?.length]);

  const scrollToBottom = useCallback((): void => {
    const viewport = scrollViewportRef.current;
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "instant" });
      requestAnimationFrame(() => {
        requestAnimationFrame(checkScrollPosition);
      });
    }
    messagesEndRef.current?.scrollIntoView();
  }, [checkScrollPosition]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessageQuery.data, streamedContent, isAwaitingResponse, scrollToBottom]);

  useEffect(() => {
    if (!chatMessageQuery.data?.length || chatMessageQuery.isLoading) return;

    const checkAfterRender = (): void => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          checkScrollPosition();
        });
      });
    };

    checkAfterRender();
    const timeoutId = setTimeout(checkAfterRender, 100);

    return (): void => {
      clearTimeout(timeoutId);
    };
  }, [chatMessageQuery.data?.length, chatMessageQuery.isLoading, checkScrollPosition]);

  useEffect(() => {
    if (!chatMessageQuery.data?.length) {
      setShowScrollToBottom(false);
      return;
    }

    let timeoutId: number | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let contentObserver: MutationObserver | null = null;
    let viewport: HTMLDivElement | null = null;

    const delayedCheck = (): void => {
      requestAnimationFrame(() => {
        requestAnimationFrame(checkScrollPosition);
      });
    };

    const setupScrollListener = (): void => {
      viewport = scrollViewportRef.current;
      if (!viewport) {
        timeoutId = window.setTimeout(setupScrollListener, 50);
        return;
      }

      checkScrollPosition();
      delayedCheck();
      viewport.addEventListener("scroll", checkScrollPosition);

      resizeObserver = new ResizeObserver(() => {
        delayedCheck();
      });
      resizeObserver.observe(viewport);

      contentObserver = new MutationObserver(() => {
        delayedCheck();
      });
      if (viewport.parentElement) {
        contentObserver.observe(viewport.parentElement, {
          childList: true,
          subtree: true,
        });
      }
    };

    setupScrollListener();

    return (): void => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      if (viewport) {
        viewport.removeEventListener("scroll", checkScrollPosition);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (contentObserver) {
        contentObserver.disconnect();
      }
    };
  }, [checkScrollPosition, chatMessageQuery.data?.length]);

  const sendMessage = async (data: {
    message: ChatMessageI;
    chatId: string;
    approval_id?: string;
    is_approved?: boolean;
    attributes?: Array<{ type: "node" | "finding"; id: string }>;
  }): Promise<void> => {
    if (!chatQuery.data) return;
    if (!data.message.message.trim() && !data.approval_id) return;

    setIsAwaitingResponse(true);
    if (!pendingApprovalId) {
      setStreamedContent("");
      setCurrentEventType("");
    }

    try {
      const body = {
        ...data,
        message: data.message.message.trim() || "",
        attributes: data.attributes || [],
      };

      let bodyString: string;
      try {
        bodyString = JSON.stringify(body);
      } catch (stringifyError) {
        console.error("Failed to stringify request body:", stringifyError, body);
        const errorMessage =
          stringifyError instanceof Error ? stringifyError.message : String(stringifyError);
        throw new Error(`Failed to serialize message: ${errorMessage}`);
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: bodyString,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API request failed: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          if (errorText) {
            errorMessage = errorText;
          }
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      setIsAwaitingResponse(false);
      let buffered = "";
      const decoder = new TextDecoder();
      let finalMessage = "";
      let done = false;

      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (done) break;
        const { value } = result;

        buffered += decoder.decode(value, { stream: true });
        const lines = buffered.split("\n");
        buffered = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);

            if (parsed.event_type === "approval") {
              if (parsed.id) {
                setPendingApprovalId(parsed.id);
              }
              setApprovalContent(parsed.content);
              setStreamedContent("");
            } else {
              setApprovalContent("");
              setPendingApprovalId(null);
              setCurrentEventType(parsed.event_type);
              setStreamedContent(parsed.content);
            }

            const codeFenceCount = (parsed.content.match(/```/g) || []).length;
            if (codeFenceCount % 2 !== 0) {
              setBuffer("\n```");
            } else {
              setBuffer("");
            }

            if (parsed.event_type === "text") {
              finalMessage = parsed.content;
            }
          } catch {
            // Ignore parsing errors
          }
        }
      }

      if (finalMessage) {
        const systemMessageData: ChatMessageI = {
          id: (Date.now() + 1).toString(),
          created_at: new Date().toISOString(),
          chat_id: chatQuery.data.id,
          chat_role: "system",
          message: finalMessage,
          tools: [],
          code_version_id: chatQuery.data.code_version_id,
          analysis_node_id: chatQuery.data.analysis_node_id,
        };
        // we already optimistically added the user message upon submission.
        queryClient.setQueryData(
          generateQueryKey.chatMessages(selectedChatId!),
          (oldData: ChatMessageI[]) => {
            return [...oldData, systemMessageData];
          },
        );
        setStreamedContent("");
        setCurrentEventType("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      toast.error(errorMessage);
      // undo the optimistically added user message.
      queryClient.setQueryData(
        generateQueryKey.chatMessages(selectedChatId!),
        (oldData: ChatMessageI[]) => {
          const newData = oldData.slice(0, -1);
          return newData;
        },
      );
    } finally {
      setIsLoading(false);
      setIsAwaitingResponse(false);
    }
  };

  const handleSendMessage = async (
    message: string,
    attributes: Array<{ type: "node" | "finding"; id: string }>,
  ): Promise<void> => {
    if (!chatQuery.data) return;
    if (!message.trim()) return;

    const userMessage: ChatMessageI = {
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      chat_id: chatQuery.data.id,
      chat_role: "user",
      message: message.trim(),
      tools: [],
      code_version_id: chatQuery.data.code_version_id,
      analysis_node_id: chatQuery.data.analysis_node_id,
    };

    // optimistically add it.
    queryClient.setQueryData(
      generateQueryKey.chatMessages(selectedChatId!),
      (oldData: ChatMessageI[]) => {
        return [...oldData, userMessage];
      },
    );

    setIsLoading(true);
    setPendingApprovalId(null);
    setApprovalContent("");
    sendMessage({ message: userMessage, chatId: selectedChatId!, attributes });
  };

  const handleApproval = async (isApproved: boolean): Promise<void> => {
    if (!chatQuery.data) return;
    if (!pendingApprovalId) return;

    // fake message. Can likely remove and just pass approvalId. We do not add this to the query client.
    // if a user leaves the page then comes back, this should not be shown (And it's not stored in the DB).
    const userMessage: ChatMessageI = {
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      chat_id: chatQuery.data.id,
      chat_role: "user",
      message: "",
      tools: [],
      code_version_id: chatQuery.data.code_version_id,
      analysis_node_id: chatQuery.data.analysis_node_id,
    };

    const approvalId = pendingApprovalId;
    setIsLoading(true);
    setPendingApprovalId(null);
    setApprovalContent("");
    setStreamedContent("");
    setCurrentEventType("");
    await sendMessage({
      message: userMessage,
      chatId: selectedChatId!,
      approval_id: approvalId,
      is_approved: isApproved,
    });
  };

  const showEmptyState = chatMessageQuery.data?.length === 0 && !isLoading;

  return (
    <div className={cn("flex flex-col bg-background grow min-h-0 min-w-0")}>
      <div className="flex-1 min-h-0 min-w-0 flex flex-col">
        {chatMessageQuery.isLoading && (
          <div className="flex items-center justify-center h-full">
            <Loader className="size-6" />
          </div>
        )}
        {showEmptyState && !chatMessageQuery.isLoading && (
          <ChatEmptyState onSendMessage={handleSendMessage} />
        )}
        {(chatMessageQuery.data ?? []).length > 0 && chatQuery.data && (
          <ScrollArea
            className="min-h-0 min-w-0 no-scrollbar chat-holder"
            ref={messagesContainerRef}
            viewportRef={scrollViewportRef as React.RefObject<HTMLDivElement>}
          >
            <div
              className="flex flex-col gap-4 px-2 overflow-x-hidden"
              style={{
                maxWidth: isMaximized ? "48rem" : maxWidth || "24rem",
              }}
            >
              {chatMessageQuery.data?.map((message) => (
                <div key={message.id} className="w-full">
                  <Chat.Message role={message.chat_role} content={message.message} />
                </div>
              ))}
              <ChatStreamingContent
                currentEventType={currentEventType}
                streamedContent={streamedContent}
                buffer={buffer}
                isAwaitingResponse={isAwaitingResponse}
                pendingApprovalId={pendingApprovalId}
                approvalContent={approvalContent}
                onApproval={handleApproval}
              />
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}
      </div>
      <div className="relative">
        {showScrollToBottom && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
            <Button
              onClick={scrollToBottom}
              size="icon-sm"
              variant="outline"
              className="hover:bg-input"
            >
              <ChevronDown className="size-4" />
            </Button>
          </div>
        )}
        <ChatInput
          teamSlug={teamSlug}
          codeId={codeId}
          findingContext={findingContext}
          availableFindings={availableFindings}
          onRemoveFindingFromContext={onRemoveFindingFromContext}
          onSendMessage={handleSendMessage}
          messagesContainerRef={messagesContainerRef}
        />
      </div>
    </div>
  );
};
