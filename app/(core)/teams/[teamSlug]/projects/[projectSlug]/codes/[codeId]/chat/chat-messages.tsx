"use client";

import { chatActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import * as Chat from "@/components/ui/chat";
import { Loader } from "@/components/ui/loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { ChatMessageI } from "@/utils/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatInput } from "./chat-input";
import { ChatStreamingContent } from "./chat-streaming-content";

interface ChatMessagesProps {
  teamSlug: string;
  chatId: string | undefined;
  codeId: string;
  onChatCreated: (chatId: string) => void;
  fullWidth?: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  teamSlug,
  chatId,
  codeId,
  onChatCreated,
  fullWidth = false,
}) => {
  const [messages, setMessages] = useState<ChatMessageI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [currentEventType, setCurrentEventType] = useState("");
  const [streamedContent, setStreamedContent] = useState("");
  const [buffer, setBuffer] = useState("");
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const chatQuery = useQuery({
    queryKey: generateQueryKey.chat(chatId!),
    queryFn: () => chatActions.getChat(teamSlug, chatId!),
    enabled: !!chatId,
  });

  const chatMessageQuery = useQuery({
    queryKey: generateQueryKey.chatMessages(chatId!),
    queryFn: () => chatActions.getChatMessages(teamSlug, chatId!),
    enabled: !!chatId,
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

  const sendMessage = async (message: string, currentChatId: string): Promise<void> => {
    if (!message.trim()) return;

    setIsAwaitingResponse(true);
    setStreamedContent("");
    setCurrentEventType("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          chatId: currentChatId,
          attributes: [],
        }),
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
            setCurrentEventType(parsed.event_type);
            setStreamedContent(parsed.content);

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
            role: "system",
            content: finalMessage,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
      setStreamedContent("");
      setCurrentEventType("");
    } catch {
      toast.error("Failed to send message");
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "system",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsAwaitingResponse(false);
    }
  };

  const handleSendMessage = async (message: string): Promise<void> => {
    if (!message.trim()) return;

    const userMessage: ChatMessageI = {
      id: Date.now().toString(),
      role: "user",
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);
    if (!chatId) {
      try {
        const newChat = await chatActions.initiateChat(teamSlug, {
          chat_type: "code",
          code_version_id: codeId,
        });

        newChat.toInvalidate.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
        onChatCreated(newChat.id);
        sendMessage(message, newChat.id);
      } catch {
        toast.error("Unable to create chat");
      }
    } else {
      sendMessage(message, chatId);
    }
  };

  const isInitialLoading =
    (chatQuery.isLoading || chatMessageQuery.isLoading) &&
    !chatQuery.data &&
    !chatMessageQuery.data;
  const showEmptyState = !chatId || (messages.length === 0 && !!chatQuery.data && !isLoading);

  return (
    <div
      className={cn(
        "flex flex-col bg-background grow min-h-0 w-full",
        !fullWidth && "max-w-3xl m-auto",
      )}
    >
      <div className="flex-1 min-h-0 flex flex-col">
        {isInitialLoading && !messages.length && (
          <div className="flex items-center justify-center h-full">
            <Loader className="size-6" />
          </div>
        )}
        {showEmptyState && !isInitialLoading && (
          <ChatEmptyState onSendMessage={handleSendMessage} />
        )}
        {messages.length > 0 && (
          <ScrollArea
            className="min-h-0 flex-1 no-scrollbar"
            ref={messagesContainerRef}
            viewportRef={scrollViewportRef as React.RefObject<HTMLDivElement>}
          >
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <Chat.Message role={message.role} content={message.content} key={message.id} />
              ))}
              <ChatStreamingContent
                currentEventType={currentEventType}
                streamedContent={streamedContent}
                buffer={buffer}
                isAwaitingResponse={isAwaitingResponse}
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
          codeId={codeId}
          onSendMessage={handleSendMessage}
          messagesContainerRef={messagesContainerRef}
        />
      </div>
    </div>
  );
};
