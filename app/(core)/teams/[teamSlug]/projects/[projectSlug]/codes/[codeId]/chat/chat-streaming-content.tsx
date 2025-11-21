"use client";

import { Cog, Lightbulb } from "lucide-react";
import React from "react";
import ReactMarkdown from "react-markdown";

interface ChatStreamingContentProps {
  currentEventType: string;
  streamedContent: string;
  buffer: string;
  isAwaitingResponse: boolean;
}

export const ChatStreamingContent: React.FC<ChatStreamingContentProps> = ({
  currentEventType,
  streamedContent,
  buffer,
  isAwaitingResponse,
}) => {
  if (isAwaitingResponse) {
    return (
      <div className="flex items-center space-x-2 text-muted-foreground">
        <div className="size-2 bg-neutral-400 rounded-full animate-pulse"></div>
        <span className="text-xs">Waiting for response...</span>
      </div>
    );
  }

  if (!streamedContent) return null;

  return (
    <div>
      {currentEventType === "text" ? (
        <div className="max-w-none ">
          <ReactMarkdown className="markdown">{streamedContent + buffer}</ReactMarkdown>
        </div>
      ) : (
        <div className="flex items-center space-x-2 ">
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
  );
};
