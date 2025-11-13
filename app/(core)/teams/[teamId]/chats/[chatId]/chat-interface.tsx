"use client";

import { chatActions } from "@/actions/bevor";

import { Button } from "@/components/ui/button";
import * as Chat from "@/components/ui/chat";
import { Loader } from "@/components/ui/loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { QUERY_KEYS } from "@/utils/constants";
import { ChatMessageI, NodeSearchResponseI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Cog, Lightbulb, Send } from "lucide-react";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

interface ChatInterfaceProps {
  chatId: string | null;
  teamId: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ teamId, chatId }) => {
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
    queryKey: [QUERY_KEYS.CHATS, teamId, chatId],
    queryFn: () => chatActions.getChat(teamId, chatId!),
    enabled: !!chatId,
  });

  const [messages, setMessages] = useState<ChatMessageI[]>([]);

  const TEXTAREA_MAX_HEIGHT = 264;

  const { data: chatAttributes } = useQuery({
    queryKey: ["chatAttributes", teamId, chatId],
    queryFn: () => chatActions.getChatAttributes(teamId, chatId!),
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

  const adjustTextareaHeight = (): void => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > TEXTAREA_MAX_HEIGHT ? "auto" : "hidden";
  };

  const checkScrollPosition = (): void => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isAtBottom);
    }
  };

  useLayoutEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

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

  const sendMessage = async (message: string): Promise<void> => {
    if (!message.trim()) return;

    const userMessage: ChatMessageI = {
      id: Date.now().toString(),
      role: "user",
      content: message.trim(),
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
          message: message.trim(),
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
      sendMessage(inputValue.trim());
    }
  };

  const filteredAttributes =
    chatAttributes?.filter((attr) =>
      attr.name.toLowerCase().includes(autocompleteQuery.toLowerCase()),
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
            currentAttributeIds.add(matchingAttr.merkle_hash);
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

    adjustTextareaHeight();
  };

  const insertAutocompleteItem = (item: NodeSearchResponseI): void => {
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = inputValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const beforeAt = inputValue.substring(0, lastAtIndex);
      const afterCursor = inputValue.substring(cursorPosition);
      const newValue = beforeAt + `\`${item.name}\`` + " " + afterCursor;

      setInputValue(newValue);
      setShowAutocomplete(false);
      setSelectedAttributeIds((prev) => new Set([...prev, item.merkle_hash]));

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
        sendMessage(inputValue.trim());
      }
    }
  };

  const handleDefaultMessage = (text: string): void => {
    sendMessage(text);
  };

  return (
    <div className="flex flex-col bg-background max-w-3xl m-auto grow min-h-0 w-full">
      {chatLoading ||
        (!chatData && (
          <div className="flex items-center justify-center h-full">
            <Loader className="size-6" />
          </div>
        ))}
      {messages.length === 0 && !!chatData && (
        <Chat.Empty>
          <Chat.EmptyCta>
            <p className="text-2xl font-medium mb-1">Start a conversation</p>
            <p className="text-lg text-muted-foreground">
              Ask questions about your code & analyses
            </p>
          </Chat.EmptyCta>
          <Chat.EmptyActions>
            {[
              "What is the name of this contract?",
              "Which variables does the constructor initialize?",
            ].map((text, ind) => (
              <Chat.EmptyAction onClick={() => handleDefaultMessage(text)} key={ind}>
                {text}
              </Chat.EmptyAction>
            ))}
          </Chat.EmptyActions>
        </Chat.Empty>
      )}
      {messages.length > 0 && (
        <ScrollArea className="p-3 min-h-0 h-full" ref={messagesContainerRef}>
          <div className="flex flex-col gap-4 h-full">
            {messages.map((message) => (
              <Chat.Message role={message.role} content={message.content} key={message.id} />
            ))}

            {isAwaitingResponse && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="size-2 bg-neutral-400 rounded-full animate-pulse"></div>
                <span className="text-xs">Waiting for response...</span>
              </div>
            )}

            {streamedContent && (
              <div>
                {currentEventType === "text" ? (
                  <div className="max-w-none text-foreground">
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
                    <span className="text-sm">{streamedContent}</span>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 relative">
        <div className="rounded-3xl border bg-card p-2 shadow-sm">
          <Textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message Bevor..."
            className="flex-1 max-h-[264px] p-2 resize-none border-0 bg-transparent! leading-6 text-foreground focus-visible:outline-none focus-visible:ring-0 scrollbar-thin"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="size-8 rounded-full"
            >
              <Send className="size-3.5" />
            </Button>
          </div>
        </div>

        {showAutocomplete && filteredAttributes.length > 0 && (
          <Chat.AutoComplete
            attributes={filteredAttributes}
            selectedAutocompleteIndex={selectedAutocompleteIndex}
            insertAutocompleteItem={insertAutocompleteItem}
          />
        )}

        {showScrollToBottom && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
            <Button onClick={scrollToBottom} size="sm" className="rounded-full shadow-lg">
              <ChevronDown className="size-3" />
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
