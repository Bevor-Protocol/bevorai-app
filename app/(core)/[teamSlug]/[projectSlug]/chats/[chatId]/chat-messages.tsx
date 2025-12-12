"use client";

import { chatActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import * as Chat from "@/components/ui/chat";
import { Loader } from "@/components/ui/loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { ChatMessageI } from "@/utils/types";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatInput } from "./chat-input";
import { ChatStreamingContent } from "./chat-streaming-content";

interface ChatMessagesProps {
  teamSlug: string;
  chatId: string;
  fullWidth?: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  teamSlug,
  chatId,
  fullWidth = false,
}) => {
  const [messages, setMessages] = useState<ChatMessageI[]>([]);
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

  const chatMessageQuery = useQuery({
    queryKey: generateQueryKey.chatMessages(chatId),
    queryFn: () => chatActions.getChatMessages(teamSlug, chatId),
  });

  const chatQuery = useSuspenseQuery({
    queryKey: generateQueryKey.chat(chatId),
    queryFn: () => chatActions.getChat(teamSlug, chatId),
  });

  useEffect(() => {
    if (chatMessageQuery.data) {
      setMessages(chatMessageQuery.data);
    }
  }, [chatMessageQuery.data]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedContent, isAwaitingResponse]);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    const checkScrollPosition = (): void => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isAtBottom && messages.length > 0);
    };

    checkScrollPosition();
    viewport.addEventListener("scroll", checkScrollPosition);

    return (): void => {
      viewport.removeEventListener("scroll", checkScrollPosition);
    };
  }, [messages.length]);

  const scrollToBottom = (): void => {
    const viewport = scrollViewportRef.current;
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (data: {
    message: string;
    chatId: string;
    approval_id?: string;
    is_approved?: boolean;
    attributes?: string[];
  }): Promise<void> => {
    if (!data.message.trim() && !data.approval_id) return;

    setIsAwaitingResponse(true);
    if (!pendingApprovalId) {
      setStreamedContent("");
      setCurrentEventType("");
    }

    try {
      const body = {
        ...data,
        message: data.message.trim() || "",
        attributes: data.attributes || [],
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
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
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            created_at: new Date().toISOString(),
            chat_id: chatQuery.data.id,
            chat_role: "system",
            message: finalMessage,
            tools: [],
            code_mapping_id: chatQuery.data.code_mapping_id,
            analysis_node_id: chatQuery.data.analysis_node_id,
          },
        ]);
        setStreamedContent("");
        setCurrentEventType("");
      }
    } catch {
      toast.error("Failed to send message");
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          chat_id: chatQuery.data.id,
          created_at: new Date().toISOString(),
          chat_role: "system",
          tools: [],
          message: "Sorry, I encountered an error. Please try again.",
          code_mapping_id: chatQuery.data.code_mapping_id,
          analysis_node_id: chatQuery.data.analysis_node_id,
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsAwaitingResponse(false);
    }
  };

  const handleSendMessage = async (message: string, attributes: string[]): Promise<void> => {
    if (!message.trim()) return;

    const userMessage: ChatMessageI = {
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      chat_id: chatQuery.data.id,
      chat_role: "user",
      message: message.trim(),
      tools: [],
      code_mapping_id: chatQuery.data.code_mapping_id,
      analysis_node_id: chatQuery.data.analysis_node_id,
    };

    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);
    setPendingApprovalId(null);
    setApprovalContent("");
    sendMessage({ message, chatId, attributes });
  };

  const handleApproval = async (isApproved: boolean): Promise<void> => {
    if (!pendingApprovalId) return;

    const approvalId = pendingApprovalId;
    setIsLoading(true);
    setPendingApprovalId(null);
    setApprovalContent("");
    setStreamedContent("");
    setCurrentEventType("");
    await sendMessage({ message: "", chatId, approval_id: approvalId, is_approved: isApproved });
  };

  const showEmptyState = messages.length === 0 && !isLoading;

  return (
    <div
      className={cn(
        "flex flex-col bg-background grow min-h-0 w-full",
        !fullWidth && "max-w-3xl m-auto",
      )}
    >
      <div className="flex-1 min-h-0 flex flex-col">
        {chatMessageQuery.isLoading && !messages.length && (
          <div className="flex items-center justify-center h-full">
            <Loader className="size-6" />
          </div>
        )}
        {showEmptyState && !chatMessageQuery.isLoading && (
          <ChatEmptyState onSendMessage={handleSendMessage} />
        )}
        {messages.length > 0 && (
          <ScrollArea
            className="min-h-0 w-full no-scrollbar"
            ref={messagesContainerRef}
            viewportRef={scrollViewportRef as React.RefObject<HTMLDivElement>}
          >
            <div className="flex flex-col gap-4 max-w-3xl">
              {messages.map((message) => (
                <Chat.Message
                  role={message.chat_role}
                  content={message.message}
                  isDiffVersion={message.code_mapping_id != chatQuery.data.code_mapping_id}
                  key={message.id}
                />
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
          chatId={chatId}
          onSendMessage={handleSendMessage}
          messagesContainerRef={messagesContainerRef}
        />
      </div>
    </div>
  );
};
