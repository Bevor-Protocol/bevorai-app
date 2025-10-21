"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import * as Chat from "@/components/ui/chat";
import { Textarea } from "@/components/ui/textarea";
import { ChatAttributeI, ChatMessageI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Cog, Lightbulb, MessageSquare, Send } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

interface ChatInterfaceProps {
  chatId: string;
  teamId: string;
  projectId: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatId }) => {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [currentEventType, setCurrentEventType] = useState("");
  const [streamedContent, setStreamedContent] = useState("");
  const [buffer, setBuffer] = useState("");
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(0);
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: chatData, isLoading: chatLoading } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => bevorAction.getChat(chatId),
  });

  const [messages, setMessages] = useState<ChatMessageI[]>([]);

  const { data: chatAttributes } = useQuery({
    queryKey: ["chatAttributes", chatId],
    queryFn: () => bevorAction.getChatAttributes(chatId),
    enabled: !!chatId,
  });

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
    setSelectedAttributeIds(new Set());
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
          attributes: Array.from(selectedAttributeIds),
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

  const filteredAttributes =
    chatAttributes?.filter((attr) =>
      attr.string.toLowerCase().includes(autocompleteQuery.toLowerCase()),
    ) || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const value = e.target.value;
    const previousValue = inputValue;
    setInputValue(value);

    // Check if content was deleted (backspace/delete)
    if (value.length < previousValue.length) {
      // Find which attributes might have been removed
      const currentAttributeIds = new Set<string>();
      const backtickMatches = value.match(/`([^`]+)`/g);

      if (backtickMatches) {
        backtickMatches.forEach((match) => {
          const name = match.slice(1, -1); // Remove backticks
          const matchingAttr = chatAttributes?.find((attr) => attr.name === name);
          if (matchingAttr) {
            currentAttributeIds.add(matchingAttr.id);
          }
        });
      }

      setSelectedAttributeIds(currentAttributeIds);
    }

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setAutocompleteQuery(textAfterAt);
        setShowAutocomplete(true);
        setSelectedAutocompleteIndex(0);
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  const insertAutocompleteItem = (item: ChatAttributeI): void => {
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = inputValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const beforeAt = inputValue.substring(0, lastAtIndex);
      const afterCursor = inputValue.substring(cursorPosition);
      const newValue = beforeAt + `\`${item.name}\`` + " " + afterCursor;

      setInputValue(newValue);
      setShowAutocomplete(false);
      setSelectedAttributeIds((prev) => new Set([...prev, item.id]));

      setTimeout(() => {
        const newCursorPos = beforeAt.length + `\`${item.name}\``.length + 1;
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const scrollToSelectedItem = (index: number): void => {
    const dropdown = document.querySelector("[data-autocomplete-dropdown]");
    if (!dropdown) return;

    const items = dropdown.querySelectorAll("[data-autocomplete-item]");
    const selectedItem = items[index] as HTMLElement;
    if (!selectedItem) return;

    const dropdownRect = dropdown.getBoundingClientRect();
    const itemRect = selectedItem.getBoundingClientRect();

    if (itemRect.top < dropdownRect.top) {
      selectedItem.scrollIntoView({ block: "start", behavior: "smooth" });
    } else if (itemRect.bottom > dropdownRect.bottom) {
      selectedItem.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (showAutocomplete && filteredAttributes.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const newIndex =
          selectedAutocompleteIndex < filteredAttributes.length - 1
            ? selectedAutocompleteIndex + 1
            : 0;
        setSelectedAutocompleteIndex(newIndex);
        scrollToSelectedItem(newIndex);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const newIndex =
          selectedAutocompleteIndex > 0
            ? selectedAutocompleteIndex - 1
            : filteredAttributes.length - 1;
        setSelectedAutocompleteIndex(newIndex);
        scrollToSelectedItem(newIndex);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertAutocompleteItem(filteredAttributes[selectedAutocompleteIndex]);
      } else if (e.key === "Escape") {
        setShowAutocomplete(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isLoading) {
        sendMessage();
      }
    }
  };

  if (chatLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading chat...</div>
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
                <h3 className="text-sm font-medium text-foreground mb-1">Start a conversation</h3>
                <p className="text-xs text-neutral-500">Ask questions about your code</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id}>
                {message.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-lg p-2.5 bg-blue-600 text-foreground">
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown className="markdown">{message.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none text-foreground">
                    <ReactMarkdown className="markdown">{message.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))
          )}

          {isAwaitingResponse && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <div className="size-2 bg-neutral-400 rounded-full animate-pulse"></div>
              <span className="text-xs">Waiting for response...</span>
            </div>
          )}

          {streamedContent && (
            <div>
              {currentEventType === "text" ? (
                <div className="prose prose-sm prose-invert max-w-none text-foreground">
                  <ReactMarkdown className="markdown">{streamedContent + buffer}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-foreground">
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
      </div>

      <div className="p-2.5 border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (use @ for autocomplete)"
              className="flex-1 min-h-24 max-h-48 w-full resize-none"
            />

            {showAutocomplete && filteredAttributes.length > 0 && (
              <Chat.AutoComplete
                attributes={filteredAttributes}
                selectedAutocompleteIndex={selectedAutocompleteIndex}
                insertAutocompleteItem={insertAutocompleteItem}
              />
            )}
            {showScrollToBottom && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10 bg-blue-600 rounded-full">
                <Button onClick={scrollToBottom} size="sm" className="rounded-full shadow-lg">
                  <ChevronDown className="size-3" />
                </Button>
              </div>
            )}
          </div>
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
