"use client";

import { chatActions } from "@/actions/bevor";

import { useQuery } from "@tanstack/react-query";
import React from "react";
import { ChatElement, ChatElementLoader } from "./chat-elements";
import { ChatEmpty } from "./chat-empty";

export const ChatGrid: React.FC<{
  query: Record<string, string>;
}> = ({ query }) => {
  const { data: chats, isLoading } = useQuery({
    queryKey: ["chats", query],
    queryFn: () => chatActions.getChats(query),
  });

  if (!chats || isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <ChatElementLoader key={index} />
        ))}
      </div>
    );
  }

  if (chats.results.length === 0) {
    return <ChatEmpty centered />;
  }

  return (
    <div className="space-y-4">
      {chats.results.map((chat) => (
        <ChatElement key={chat.id} chat={chat} />
      ))}
    </div>
  );
};
