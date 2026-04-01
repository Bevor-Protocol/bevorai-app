"use client";

import { analysisActions, chatActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import ChatClosed from "@/components/views/chat/closed";
import { ChatMessages } from "@/components/views/chat/messages";
import ChatThreads from "@/components/views/chat/threads";
import { useChat } from "@/providers/chat";
import { FindingSchema } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { extractQueryParams } from "@/utils/query-params";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { History, Maximize2, Minimize2, X } from "lucide-react";

interface CollapsibleChatPanelProps {
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
  findingContext?: FindingSchema[];
  onRemoveFindingFromContext?: (findingId: string) => void;
}

const CHAT_PANEL_WIDTH = "24rem";

const CollapsibleChatPanel: React.FC<CollapsibleChatPanelProps> = ({
  teamSlug,
  projectSlug,
  nodeId,
  findingContext,
  onRemoveFindingFromContext,
}) => {
  const {
    isExpanded,
    toggleExpanded,
    showSettings,
    setShowSettings,
    selectedChatId,
    toggleMaximized,
    isMaximized,
  } = useChat();

  const { data: version } = useSuspenseQuery({
    queryKey: generateQueryKey.analysis(nodeId),
    queryFn: () =>
      analysisActions.getAnalysis(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const { data: findings } = useSuspenseQuery({
    queryKey: generateQueryKey.analysisFindings(nodeId),
    queryFn: () =>
      analysisActions.getAnalysisFindings(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const chatQuery = extractQueryParams({
    project_slug: projectSlug,
    code_version_id: version.code_version_id,
    analysis_id: version.id,
    chat_type: "analysis",
  });

  const chatsQuery = useQuery({
    queryKey: generateQueryKey.chats(teamSlug, chatQuery),
    queryFn: () =>
      chatActions.getSecurityChats(teamSlug, chatQuery).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  if (!isExpanded) {
    return <ChatClosed />;
  }

  return (
    <aside
      className={`flex flex-col min-h-0 bg-background border border-border rounded-lg overflow-hidden ${
        isMaximized ? "fixed right-0 z-50 shadow-2xl" : "relative"
      }`}
      style={
        isMaximized
          ? {
              width: "50vw",
              maxWidth: "48rem",
              top: "calc(var(--spacing-header) + var(--spacing-subheader))",
              height: "calc(100vh - var(--spacing-header) - var(--spacing-subheader))",
            }
          : { width: CHAT_PANEL_WIDTH }
      }
    >
      <div className="flex items-center justify-end gap-1 px-2 h-subheader border-b border-border shrink-0">
        {selectedChatId && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowSettings(!showSettings)}
            title="Show chat list"
          >
            <History className="size-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleMaximized}
          title={isMaximized ? "Minimize chat" : "Maximize chat"}
        >
          {isMaximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={toggleExpanded} title="Collapse chat">
          <X className="size-4" />
        </Button>
      </div>
      {showSettings || !selectedChatId ? (
        <ChatThreads chatsQuery={chatsQuery} />
      ) : (
        <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
          <ChatMessages
            teamSlug={teamSlug}
            codeId={version.code_version_id}
            findingContext={findingContext}
            availableFindings={findings}
            onRemoveFindingFromContext={onRemoveFindingFromContext}
            maxWidth={CHAT_PANEL_WIDTH}
          />
        </div>
      )}
    </aside>
  );
};

export default CollapsibleChatPanel;
