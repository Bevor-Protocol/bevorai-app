"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { navigation } from "@/utils/navigation";
import { ChatMessageI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, Cog, Lightbulb, MessageSquare, Send } from "lucide-react";
import Link from "next/link";
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
      return () => container.removeEventListener("scroll", checkScrollPosition);
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

      // eslint-disable-next-line no-constant-condition
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
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <div className="flex items-center space-x-3">
          <Link
            href={navigation.version.chats({
              teamSlug,
              projectSlug,
              versionId: chatData?.code_version_mapping_id,
            })}
          >
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4 mr-2" />
              Back to Chats
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-semibold text-neutral-100">Chat #{chatId.slice(-8)}</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4" ref={messagesContainerRef}>
        <div className="max-w-4xl mx-auto space-y-8">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-300 mb-2">Start a conversation</h3>
                <p className="text-sm text-neutral-500">
                  Ask questions about your code analysis or get help with your project.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id}>
                {message.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-lg p-3 bg-blue-600 text-white">
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown className="markdown">{message.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none text-neutral-100">
                    <ReactMarkdown className="markdown">{message.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))
          )}

          {isAwaitingResponse && (
            <div className="flex items-center space-x-2 text-neutral-400">
              <div className="size-2 bg-neutral-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Waiting for response...</span>
            </div>
          )}

          {streamedContent && (
            <div>
              {currentEventType === "text" ? (
                <div className="prose prose-invert max-w-none text-neutral-100">
                  <ReactMarkdown className="markdown">{streamedContent + buffer}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-neutral-300">
                  {currentEventType === "tool-call" && (
                    <Cog className="size-4 text-blue-400 animate-spin" />
                  )}
                  {currentEventType === "thinking" && (
                    <Lightbulb className="size-4 text-yellow-400 animate-pulse" />
                  )}
                  <span className="text-sm">{streamedContent}</span>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {showScrollToBottom && (
          <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-10">
            <Button onClick={scrollToBottom} size="sm" className="rounded-full shadow-lg">
              <ChevronDown className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-neutral-800">
        <div className="max-w-4xl mx-auto">
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
              className="flex-1 p-3 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[3rem] max-h-32"
              disabled={isLoading}
            />
            <Button type="submit" disabled={!inputValue.trim() || isLoading} className="px-4 py-2">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
