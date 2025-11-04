"use client";

import { chatActions } from "@/actions/bevor";

import { QUERY_KEYS } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { ChatElement, ChatElementLoader } from "./chat-elements";
import { ChatEmpty } from "./chat-empty";

export const ChatGrid: React.FC<{
  teamId: string;
  query: Record<string, string>;
}> = ({ teamId, query }) => {
  const { data: chats, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.CHATS, teamId, query],
    queryFn: () => chatActions.getChats(teamId, query),
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
