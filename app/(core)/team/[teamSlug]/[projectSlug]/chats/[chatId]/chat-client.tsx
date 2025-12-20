"use client";

import { DefaultChatsQuery } from "@/utils/query-params";
import { ChatMessages } from "./chat-messages";
import { Sidebar } from "./sidebar";

interface ChatClientProps {
  teamSlug: string;
  query: typeof DefaultChatsQuery;
  projectSlug: string;
  chatId: string;
}

const ChatClient: React.FC<ChatClientProps> = ({ teamSlug, query, projectSlug, chatId }) => {
  return (
    <div className="flex gap-6 flex-1 min-h-0 h-full">
      <div className="flex flex-col bg-background grow min-h-0 flex-1 relative">
        <ChatMessages teamSlug={teamSlug} chatId={chatId} />
      </div>
      <Sidebar teamSlug={teamSlug} query={query} projectSlug={projectSlug} chatId={chatId} />
    </div>
  );
};

export default ChatClient;
