"use client";

import { DefaultChatsQuery } from "@/utils/query-params";
import { ChatSchemaI } from "@/utils/types";
import { useState } from "react";
import { ChatMessages } from "./chat-messages";
import { Sidebar } from "./sidebar";

interface ChatClientProps {
  teamSlug: string;
  query: typeof DefaultChatsQuery;
  projectSlug: string;
  codeId: string;
  defaultChat: ChatSchemaI | null;
}

const ChatClient: React.FC<ChatClientProps> = ({
  teamSlug,
  query,
  projectSlug,
  codeId,
  defaultChat,
}) => {
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(defaultChat?.id);

  return (
    <div className="flex gap-6 flex-1 min-h-0 h-full">
      <div className="flex flex-col bg-background grow min-h-0 flex-1 relative">
        <ChatMessages
          teamSlug={teamSlug}
          chatId={selectedChatId}
          codeId={codeId}
          onChatCreated={setSelectedChatId}
        />
      </div>
      <Sidebar
        teamSlug={teamSlug}
        query={query}
        projectSlug={projectSlug}
        selectedChatId={selectedChatId}
        onChatSelect={setSelectedChatId}
        onNewChat={() => setSelectedChatId(undefined)}
        isCreatingChat={false}
        canCreateChat={true}
      />
    </div>
  );
};

export default ChatClient;
