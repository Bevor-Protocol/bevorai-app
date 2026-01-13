"use client";

import { chatActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import ChatClosed from "@/components/views/chat/closed";
import { ChatMessages } from "@/components/views/chat/messages";
import ChatThreads from "@/components/views/chat/threads";
import { useChat } from "@/providers/chat";
import { generateQueryKey } from "@/utils/constants";
import { extractChatsQuery } from "@/utils/query-params";
import { useQuery } from "@tanstack/react-query";
import { Settings, X } from "lucide-react";

interface CollapsibleChatPanelProps {
  teamSlug: string;
  projectSlug: string;
  codeId: string;
}

const CHAT_PANEL_WIDTH = "24rem";

const CollapsibleChatPanel: React.FC<CollapsibleChatPanelProps> = ({
  teamSlug,
  projectSlug,
  codeId,
}) => {
  const { isExpanded, toggleExpanded, showSettings, setShowSettings, selectedChatId } = useChat();

  const chatQuery = extractChatsQuery({
    project_slug: projectSlug,
    code_version_id: codeId,
    chat_type: "code",
  });

  const chatsQuery = useQuery({
    queryKey: generateQueryKey.chats(teamSlug, chatQuery),
    queryFn: () =>
      chatActions.getChats(teamSlug, chatQuery).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  if (!isExpanded) {
    return <ChatClosed />;
  }

  return (
    <aside className="flex flex-col min-h-0 pr-2 bg-background" style={{ width: CHAT_PANEL_WIDTH }}>
      <div className="flex items-center justify-end gap-1 p-2">
        {selectedChatId && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowSettings(!showSettings)}
            title="Show chat list"
          >
            <Settings className="size-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" onClick={toggleExpanded} title="Collapse chat">
          <X className="size-4" />
        </Button>
      </div>
      {showSettings || !selectedChatId ? (
        <ChatThreads chatsQuery={chatsQuery} />
      ) : (
        <div className="flex-1 min-h-0 min-w-0 flex flex-col">
          <ChatMessages teamSlug={teamSlug} codeId={codeId} maxWidth={CHAT_PANEL_WIDTH} />
        </div>
      )}
    </aside>
  );
};

export default CollapsibleChatPanel;
