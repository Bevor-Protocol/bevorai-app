"use client";

import { ChatPaginationI } from "@/utils/types";
import React from "react";
import { ChatElement, ChatElementLoader } from "./chat-elements";
import { ChatEmpty } from "./chat-empty";

export const ChatGrid: React.FC<{
  data?: ChatPaginationI;
  isLoading: boolean;
}> = ({ data, isLoading }) => {
  if (!data || isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <ChatElementLoader key={index} />
        ))}
      </div>
    );
  }

  if (data.results.length === 0) {
    return <ChatEmpty centered />;
  }

  return (
    <div className="space-y-4">
      {data.results.map((chat) => (
        <ChatElement key={chat.id} chat={chat} />
      ))}
    </div>
  );
};
