"use client";

import { Button } from "@/components/ui/button";
import { Cog, Lightbulb, X } from "lucide-react";
import React from "react";
import ReactMarkdown from "react-markdown";

interface ChatStreamingContentProps {
  currentEventType: string;
  streamedContent: string;
  buffer: string;
  isAwaitingResponse: boolean;
  pendingApprovalId: string | null;
  approvalContent: string;
  onApproval: (isApproved: boolean) => Promise<void>;
}

export const ChatStreamingContent: React.FC<ChatStreamingContentProps> = ({
  currentEventType,
  streamedContent,
  buffer,
  isAwaitingResponse,
  pendingApprovalId,
  approvalContent,
  onApproval,
}) => {
  if (isAwaitingResponse) {
    return (
      <div className="flex items-center space-x-2 text-muted-foreground">
        <div className="size-2 bg-neutral-400 rounded-full animate-pulse"></div>
        <span className="text-xs">Waiting for response...</span>
      </div>
    );
  }

  if (pendingApprovalId && approvalContent) {
    return (
      <div className="flex flex-col gap-3">
        <div className="max-w-none">
          <ReactMarkdown className="markdown">{approvalContent + buffer}</ReactMarkdown>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onApproval(true)} variant="outline" size="sm">
            Accept
          </Button>
          <Button onClick={() => onApproval(false)} variant="outline" size="sm">
            Reject
          </Button>
        </div>
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
          {currentEventType === "failure" && <X className="size-3 text-red-400" />}
          <span className="text-sm">{streamedContent}</span>
        </div>
      )}
    </div>
  );
};
