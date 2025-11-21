"use client";

import * as Chat from "@/components/ui/chat";
import React from "react";

interface ChatEmptyStateProps {
  onSendMessage: (message: string) => void;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({ onSendMessage }) => {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 flex items-center justify-center">
        <Chat.EmptyCta>
          <p className="text-2xl font-medium mb-1">Start a conversation</p>
          <p className="text-lg text-muted-foreground">Ask questions about this code</p>
        </Chat.EmptyCta>
      </div>
      <div className="pb-4">
        <Chat.EmptyActions>
          {[
            "What is the name of this contract?",
            "Which variables does the constructor initialize?",
          ].map((text, ind) => (
            <Chat.EmptyAction onClick={() => onSendMessage(text)} key={ind}>
              {text}
            </Chat.EmptyAction>
          ))}
        </Chat.EmptyActions>
      </div>
    </div>
  );
};
