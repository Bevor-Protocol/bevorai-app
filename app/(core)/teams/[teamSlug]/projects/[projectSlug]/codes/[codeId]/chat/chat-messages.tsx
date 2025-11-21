"use client";

import { chatActions } from "@/actions/bevor";
import * as Chat from "@/components/ui/chat";
import { Loader } from "@/components/ui/loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateQueryKey } from "@/utils/constants";
import { CreateChatFormValues } from "@/utils/schema";
import { ChatMessageI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  teamSlug,
  chatId,
  codeId,
  onChatCreated,
}) => {
  const [messages, setMessages] = useState<ChatMessageI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [currentEventType, setCurrentEventType] = useState("");
  const [streamedContent, setStreamedContent] = useState("");
  const [buffer, setBuffer] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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

  const createMutation = useMutation({
    mutationFn: (params: CreateChatFormValues) => chatActions.initiateChat(teamSlug, params),
    onSuccess: ({ id, toInvalidate }) => {
      toast.success("New chat created");
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      onChatCreated(id);
    },
    onError: () => {
      toast.error("Unable to create chat");
    },
  });

  useEffect(() => {
    if (chatMessageQuery.data) {
      setMessages(chatMessageQuery.data);
    }
  }, [chatMessageQuery.data]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedContent, isAwaitingResponse]);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (message: string, currentChatId: string): Promise<void> => {
    if (!message.trim()) return;

    const userMessage: ChatMessageI = {
      id: Date.now().toString(),
      role: "user",
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
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

    if (!chatId) {
      createMutation.mutate(
        {
          code_version_id: codeId,
          chat_type: "code",
        },
        {
          onSuccess: ({ id }) => {
            sendMessage(message, id);
          },
        },
      );
    } else {
      await sendMessage(message, chatId);
    }
  };

  const isDataLoading = chatQuery.isLoading || chatMessageQuery.isLoading;
  const showEmptyState = !chatId || (messages.length === 0 && !!chatQuery.data);

  return (
    <div className="flex flex-col bg-background max-w-3xl m-auto grow min-h-0 w-full">
      <div className="flex-1 min-h-0 flex flex-col">
        {isDataLoading && chatId && (
          <div className="flex items-center justify-center h-full">
            <Loader className="size-6" />
          </div>
        )}
        {showEmptyState && !isDataLoading && <ChatEmptyState onSendMessage={handleSendMessage} />}
        {messages.length > 0 && (
          <ScrollArea className="p-3 min-h-0 flex-1" ref={messagesContainerRef}>
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
      <ChatInput
        teamSlug={teamSlug}
        chatId={chatId}
        codeId={codeId}
        onChatCreated={onChatCreated}
        onSendMessage={handleSendMessage}
        isLoading={isLoading || createMutation.isPending}
        messagesContainerRef={messagesContainerRef}
      />
    </div>
  );
};
