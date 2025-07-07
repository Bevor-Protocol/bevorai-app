"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { ChatContextType, ChatMessageI, ChatResponseI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { Clock, ExternalLink, File, MessageSquare, Send, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

export const ChatContext = createContext<ChatContextType>({
  isOpen: false,
  messages: [],
  openChat: () => {},
  closeChat: () => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendMessage: (content: string) => Promise.resolve(),
  currentAuditId: null,
  setCurrentAuditId: () => {},
});

export const ChatProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessageI[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showChatHistory, setShowChatHistory] = useState<boolean>(false);
  const [currentChat, setCurrentChat] = useState<ChatResponseI | null>(null);
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [streamedMessage, setStreamedMessage] = useState("");
  const [currentToolCall, setCurrentToolCall] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll when messages change or when streaming
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedMessage]);

  useEffect(() => {
    if (pathname.startsWith("audits")) {
      setCurrentAuditId(pathname.split("/").slice(-1)[0]);
    } else {
      setCurrentAuditId(null);
    }
  }, [pathname]);

  const { data: chats, refetch: refetchChats } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => bevorAction.getChats(),
  });

  const openChat = (): void => setIsOpen(true);
  const closeChat = (): void => {
    setIsOpen(false);
  };

  const chatsForAudit = useMemo(() => {
    if (!chats) return [];
    return chats.filter((chat) => chat.audit_id === currentAuditId);
  }, [currentAuditId, chats]);

  const otherChats = useMemo(() => {
    if (!chats) return [];
    return chats.filter((chat) => chat.audit_id !== currentAuditId);
  }, [currentAuditId, chats]);

  const initiateChat = async (): Promise<void> => {
    if (!currentAuditId) {
      console.error("Cannot initiate chat without an audit ID");
      return;
    }

    try {
      const chat = await bevorAction.initiateChat(currentAuditId);

      setCurrentChat(chat);
      setMessages([]);
      setShowChatHistory(false);
      await refetchChats();
    } catch (error) {
      console.error("Error initiating chat:", error);
    }
  };

  const loadChatHistory = async (chatId: string): Promise<void> => {
    if (!chats) return;

    const chat = await bevorAction.getChat(chatId);

    const { messages, ...rest } = chat;

    setMessages(messages); // easier to store a flattened reference.
    setCurrentChat(rest);
    setShowChatHistory(false);
  };

  const sendMessage = async (content: string): Promise<void> => {
    if (!content.trim() || !currentChat) return;

    const userMessage: ChatMessageI = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: Date().toString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    let assistantMessage = "";
    const tools_called: string[] = [];

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content.trim(),
          chatId: currentChat.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      let buffered = "";
      const decoder = new TextDecoder();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Accumulate text
        buffered += decoder.decode(value, { stream: true });

        // Split by newlines (you yield `... + b"\n"` in Python)
        const lines = buffered.split("\n");

        // Keep last line (incomplete?) in buffer
        buffered = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.event_type == "text") {
              assistantMessage += parsed.content;
              setStreamedMessage(assistantMessage);
              setCurrentToolCall(null);
            } else {
              setCurrentToolCall(parsed.content);
              tools_called.push(parsed.content);
            }
          } catch (err) {
            console.warn("Failed to parse chunk:", line, err);
          }
        }
      }
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          created_at: Date.now().toString(),
          role: "system",
          content: assistantMessage,
          timestamp: Date().toString(),
          ...(tools_called.length > 0 ? { tools_called } : {}),
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          created_at: Date.now().toString(),
          role: "system",
          content: "Sorry, there was an error processing your request. Please try again.",
          timestamp: Date().toString(),
          ...(tools_called.length > 0 ? { tools_called } : {}),
        },
      ]);
    } finally {
      setStreamedMessage("");
      setIsLoading(false);
    }
  };

  const handleSubmit = (): void => {
    if (inputValue.trim() && !!currentChat) {
      sendMessage(inputValue);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        messages,
        openChat,
        closeChat,
        sendMessage,
        currentAuditId,
        setCurrentAuditId,
      }}
    >
      {!isOpen && (
        <Button
          onClick={openChat}
          variant="bright"
          className={cn(
            "fixed bottom-4 right-4 p-3 w-fit h-fit min-w-fit",
            "z-50 rounded-full shadow-lg",
          )}
        >
          <MessageSquare size={24} />
        </Button>
      )}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-4 right-4 w-[800px] max-w-[80%] h-[800px] max-h-[80%]",
            "bg-black text-white",
            "rounded-lg flex flex-col z-50 border border-white overflow-hidden",
          )}
        >
          <div className="flex justify-between items-center p-3 border-b border-gray-500/50">
            <div className="flex flex-row gap-4">
              {!!currentAuditId && (
                <Button onClick={initiateChat} variant="bright">
                  new chat
                </Button>
              )}

              {!!currentChat && (
                <Link
                  href={`audits/${currentChat.audit_id}`}
                  className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                >
                  <span>View Audit</span>
                  <ExternalLink size={14} />
                </Link>
              )}
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setShowChatHistory(false)}
                className={cn(
                  "p-1 rounded-full hover:bg-gray-700 cursor-pointer",
                  !showChatHistory && "bg-gray-700",
                )}
              >
                <File size={18} />
              </button>
              <button
                onClick={() => setShowChatHistory(true)}
                className={cn(
                  "p-1 rounded-full hover:bg-gray-700 cursor-pointer",
                  showChatHistory && "bg-gray-700",
                )}
              >
                <Clock size={18} />
              </button>
              <button
                onClick={closeChat}
                className={cn("p-1 rounded-full hover:bg-gray-700 cursor-pointer")}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {showChatHistory && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatsForAudit && chatsForAudit.length > 0 && (
                <div>
                  <p className="mb-4">chats for current audit</p>
                  <div className="flex flex-row flex-wrap gap-4">
                    {chatsForAudit.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => loadChatHistory(chat.id)}
                        className={cn(
                          "p-2 rounded cursor-pointer hover:bg-gray-700 transition-colors",
                          "bg-gray-800 w-[200px]",
                        )}
                      >
                        <div className="font-medium text-sm truncate">
                          {chat.audit.introduction}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(chat.created_at || Date.now()).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">{chat.total_messages} messages</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {otherChats && otherChats.length > 0 && (
                <div>
                  <p>chats for other audits</p>
                  <div className="flex flex-row flex-wrap gap-4">
                    {otherChats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => loadChatHistory(chat.id)}
                        className={cn(
                          "p-2 rounded cursor-pointer hover:bg-gray-700 transition-colors",
                          "bg-gray-800 w-[200px]",
                        )}
                      >
                        <div className="font-medium text-sm truncate">
                          {chat.audit.introduction}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(chat.created_at || Date.now()).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">{chat.total_messages} messages</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!chats ||
                (chats.length === 0 && (
                  <div
                    className={cn(
                      "text-gray-500 text-center py-4 flex flex-col justify-center h-full",
                    )}
                  >
                    No previous chats found
                  </div>
                ))}
            </div>
          )}
          {!showChatHistory && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && !currentChat ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4">
                  <p className="text-center">
                    {currentAuditId
                      ? "Start a new chat about this audit"
                      : "Navigate to an audit, or initiate a new one \
                      in the terminal, to start chatting"}
                  </p>
                </div>
              ) : messages.length === 0 && !!currentChat ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <p>Start a conversation...</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[85%] p-3 rounded-lg text-sm",
                      message.role === "user"
                        ? "ml-auto bg-blue-600 text-white"
                        : "bg-gray-700 text-white",
                    )}
                  >
                    <ReactMarkdown className="markdown">{message.content}</ReactMarkdown>
                    {message.tools_called && (
                      <div className="flex flex-col ml-auto mt-1">
                        <p className="text-sm">tools called:</p>
                        {message.tools_called.map((tool, ind) => (
                          <code key={ind} className="text-xs">
                            {tool}
                          </code>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
              {streamedMessage && (
                <div className={cn("max-w-[85%] p-3 rounded-lg text-sm", "bg-gray-700 text-white")}>
                  <ReactMarkdown className="markdown">{streamedMessage}</ReactMarkdown>
                </div>
              )}
              {currentToolCall && (
                <div className="pl-4">
                  <p className="text-sm">
                    calling tool <code>{currentToolCall}</code>
                    <span
                      className={cn(
                        "animate-loading-dots inline-block overflow-x-hidden align-bottom",
                      )}
                    >
                      ...
                    </span>
                  </p>
                </div>
              )}
              {isLoading && !streamedMessage && !currentToolCall && (
                <div className="flex justify-center">
                  <Loader className="h-6 w-6" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
          <div
            onSubmit={handleSubmit}
            className={cn("p-3 border-t flex gap-2 border-gray-700 bg-gray-900")}
          >
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault(); // Prevent default enter behavior
                  if (inputValue.trim() && currentChat) {
                    handleSubmit();
                  }
                }
              }}
              placeholder="Type a message..."
              className={cn(
                "flex-1 p-2 rounded border focus:outline-none focus:ring-2 text-sm",
                "bg-gray-800 border-gray-700 text-white focus:ring-blue-500",
                "min-h-[6em] resize-none",
              )}
              disabled={isLoading || showChatHistory || !currentChat}
            />
            <Button
              variant="bright"
              disabled={isLoading || !inputValue.trim() || showChatHistory || !currentChat}
              className={cn("p-3 w-fit h-fit min-w-fit", "rounded-lg shadow-lg")}
              onClick={handleSubmit}
            >
              <Send size={20} />
            </Button>
          </div>
        </div>
      )}
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;
