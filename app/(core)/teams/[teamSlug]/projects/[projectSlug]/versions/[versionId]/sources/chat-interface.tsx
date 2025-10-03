"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { ChatMessageI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Cog, Lightbulb, MessageSquare, Send } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

interface ChatInterfaceProps {
  chatId: string;
  teamSlug: string;
  projectSlug: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatId, teamSlug, projectSlug }) => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [currentEventType, setCurrentEventType] = useState("");
  const [streamedContent, setStreamedContent] = useState("");
  const [buffer, setBuffer] = useState("");
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { data: chatData, isLoading: chatLoading } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => bevorAction.getChat(chatId),
  });

  const [messages, setMessages] = useState<ChatMessageI[]>([]);

  useEffect(() => {
    if (chatData?.messages) {
      setMessages(chatData.messages);
    }
  }, [chatData]);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkScrollPosition = (): void => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isAtBottom);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedContent, isAwaitingResponse]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollPosition);
      return (): void => container.removeEventListener("scroll", checkScrollPosition);
    }
  }, []);

  const sendMessage = async (): Promise<void> => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessageI = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
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
          message: inputValue.trim(),
          chatId,
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

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
          } catch (err) {
            console.warn("Failed to parse chunk:", line, err);
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
    } catch (error) {
      console.error("Error sending message:", error);
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

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage();
    }
  };

  if (chatLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-neutral-400">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      <div className="flex-1 overflow-y-auto p-3" ref={messagesContainerRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-neutral-300 mb-1">Start a conversation</h3>
                <p className="text-xs text-neutral-500">Ask questions about your code</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id}>
                {message.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-lg p-2.5 bg-blue-600 text-white">
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown className="markdown">{message.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none text-neutral-100">
                    <ReactMarkdown className="markdown">{message.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))
          )}

          {isAwaitingResponse && (
            <div className="flex items-center space-x-2 text-neutral-400">
              <div className="size-2 bg-neutral-400 rounded-full animate-pulse"></div>
              <span className="text-xs">Waiting for response...</span>
            </div>
          )}

          {streamedContent && (
            <div>
              {currentEventType === "text" ? (
                <div className="prose prose-sm prose-invert max-w-none text-neutral-100">
                  <ReactMarkdown className="markdown">{streamedContent + buffer}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-neutral-300">
                  {currentEventType === "tool-call" && (
                    <Cog className="size-3 text-blue-400 animate-spin" />
                  )}
                  {currentEventType === "thinking" && (
                    <Lightbulb className="size-3 text-yellow-400 animate-pulse" />
                  )}
                  <span className="text-xs">{streamedContent}</span>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {showScrollToBottom && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
            <Button onClick={scrollToBottom} size="sm" className="rounded-full shadow-lg">
              <ChevronDown className="size-3" />
            </Button>
          </div>
        )}
      </div>

      <div className="p-2.5 border-t border-neutral-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (inputValue.trim() && !isLoading) {
                  sendMessage();
                }
              }
            }}
            placeholder="Type a message..."
            className="flex-1 p-2 text-sm rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[2.5rem] max-h-24"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="px-3"
          >
            <Send className="size-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
};
