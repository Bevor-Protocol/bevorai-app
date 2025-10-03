"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/helpers";
import { ChatResponseI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, MessageSquare, Plus, X } from "lucide-react";
import React, { useState } from "react";
import { ChatInterface } from "./chat-interface";

interface ChatPanelProps {
  versionId: string;
  teamSlug: string;
  projectSlug: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ versionId, teamSlug, projectSlug }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [panelWidth, setPanelWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const queryClient = useQueryClient();

  const query = { page: currentPage.toString(), version_id: versionId, page_size: "10" };

  const { data: chats, isLoading } = useQuery({
    queryKey: ["chats", query],
    queryFn: () => bevorAction.getChats(query),
  });

  const createChatMutation = useMutation({
    mutationFn: () => bevorAction.initiateChat(versionId),
    onSuccess: (data) => {
      setSelectedChatId(data.id);
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const handleChatClick = (chatId: string): void => {
    setSelectedChatId(chatId);
  };

  const handleBackToList = (): void => {
    setSelectedChatId(null);
    queryClient.invalidateQueries({ queryKey: ["chats"] });
  };

  const handleCreateChat = (): void => {
    createChatMutation.mutate();
  };

  const totalPages = chats?.total_pages || 1;
  const hasMore = chats?.more || false;
  const hasPrevious = currentPage > 0;

  const handleMouseDown = (e: React.MouseEvent): void => {
    e.preventDefault();
    setIsResizing(true);
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 320 && newWidth <= 800) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = (): void => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }

    return (): void => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  if (!isOpen) {
    return (
      <div className="fixed right-6 bottom-6 z-20">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full shadow-lg h-14 w-14 p-0"
        >
          <MessageSquare className="size-6" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed right-6 bottom-6 top-header-comb mt-6 z-20",
        "border border-neutral-800 rounded-lg bg-neutral-950 shadow-2xl",
        "flex flex-col overflow-hidden",
      )}
      style={{ width: `${panelWidth}px` }}
    >
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500/50 transition-colors z-50",
          isResizing && "bg-blue-500",
        )}
        onMouseDown={handleMouseDown}
      />
      {selectedChatId ? (
        <>
          <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
            <Button variant="ghost" size="sm" onClick={handleBackToList}>
              <ArrowLeft className="size-4 mr-2" />
              Back to Chats
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="flex-1 min-h-0 relative">
            <div className="absolute inset-0">
              <ChatInterface
                chatId={selectedChatId}
                teamSlug={teamSlug}
                projectSlug={projectSlug}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
            <div className="flex items-center space-x-2">
              <MessageSquare className="size-5 text-blue-400" />
              <h2 className="text-base font-semibold text-neutral-100">Chat History</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>

          <div className="p-3 border-b border-neutral-800">
            <Button
              onClick={handleCreateChat}
              disabled={createChatMutation.isPending}
              className="w-full"
              size="sm"
            >
              <Plus className="size-4 mr-2" />
              {createChatMutation.isPending ? "Creating..." : "New Chat"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="border border-neutral-800 rounded-lg p-3 animate-pulse">
                    <div className="h-4 bg-neutral-800 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-neutral-800 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : chats?.results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="size-12 text-neutral-600 mb-4" />
                <h3 className="text-sm font-medium text-neutral-300 mb-2">No chats yet</h3>
                <p className="text-xs text-neutral-500 text-center px-4">
                  Start a conversation to get help with your code analysis
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {chats?.results.map((chat: ChatResponseI) => (
                  <div
                    key={chat.id}
                    onClick={() => handleChatClick(chat.id)}
                    className="border border-neutral-800 rounded-lg p-3 hover:border-neutral-700 hover:bg-neutral-900/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="size-4 text-blue-400" />
                        </div>
                        <span className="text-xs font-medium text-neutral-100">
                          Chat #{chat.id.slice(-8)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pl-10">
                      <span className="text-xs text-neutral-400">
                        {chat.total_messages} messages
                      </span>
                      <div className="flex items-center space-x-1 text-xs text-neutral-500">
                        <Clock className="size-3" />
                        <span>{formatDate(chat.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {chats && chats.results.length > 0 && (
            <div className="p-3 border-t border-neutral-800 bg-neutral-900/50">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!hasPrevious || isLoading}
                >
                  <ChevronLeft className="size-4 mr-1" />
                  Prev
                </Button>
                <span className="text-xs text-neutral-400">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!hasMore || isLoading}
                >
                  Next
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChatPanel;
