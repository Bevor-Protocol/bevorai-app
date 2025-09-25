"use client";

import { bevorAction } from "@/actions";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { ChatElement, ChatElementLoader } from "./chat-elements";
import { ChatEmpty } from "./chat-empty";

export const ChatGrid: React.FC<{
  teamSlug: string;
  projectSlug: string;
  versionId: string;
  query: Record<string, string>;
}> = ({ teamSlug, projectSlug, versionId, query }) => {
  const { data: chats, isLoading } = useQuery({
    queryKey: ["chats", query],
    queryFn: () => bevorAction.getChats(query),
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
        <ChatElement
          key={chat.id}
          chat={chat}
          teamSlug={teamSlug}
          projectSlug={projectSlug}
          versionId={versionId}
        />
      ))}
    </div>
  );
};
