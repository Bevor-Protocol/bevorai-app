"use client";

import { analysisActions, chatActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Loader } from "@/components/ui/loader";
import { useOptionalChat } from "@/providers/chat";
import { generateQueryKey } from "@/utils/constants";
import { extractQueryParams } from "@/utils/query-params";
import { useQuery } from "@tanstack/react-query";
import { History, Maximize2, MessageSquare, Minimize2, Plus, X } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import React, { useMemo } from "react";
import { ChatMessages } from "./messages";
import ChatThreads from "./threads";

const CHAT_PANEL_WIDTH = "24rem";

const GlobalChatPanel: React.FC = () => {
  const context = useOptionalChat();
  const params = useParams();
  const pathname = usePathname();

  const teamSlug = (params.teamSlug as string) || null;
  const projectSlug = (params.projectSlug as string) || null;
  const nodeId = (params.nodeId as string) || null;

  const isAnalysisCodeSubroute = !!nodeId && pathname.endsWith("/code");
  const isAnalysisWorkspaceRoute = !!nodeId && !isAnalysisCodeSubroute;

  const isEnabled = !!(context && teamSlug && nodeId);

  const analysisQuery = useQuery({
    queryKey: generateQueryKey.analysis(nodeId ?? ""),
    queryFn: () =>
      analysisActions.getAnalysis(teamSlug!, nodeId!).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: isEnabled && !!nodeId,
  });

  const effectiveNodeId = nodeId ?? context?.analysisId ?? null;
  const findingsQuery = useQuery({
    queryKey: generateQueryKey.analysisFindings(effectiveNodeId ?? ""),
    queryFn: () =>
      analysisActions.getAnalysisFindings(teamSlug!, effectiveNodeId!).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: isEnabled && !!effectiveNodeId && !!nodeId,
  });

  const codeVersionId = analysisQuery.data?.code_version_id ?? null;
  const analysisIdFromContext = context?.analysisId;

  const chatQueryParams = useMemo(() => {
    if (!projectSlug || !codeVersionId || !analysisIdFromContext) return null;
    return extractQueryParams({
      project_slug: projectSlug,
      code_version_id: codeVersionId,
      analysis_id: analysisIdFromContext,
      chat_type: "analysis",
    });
  }, [projectSlug, codeVersionId, analysisIdFromContext]);

  const chatsQuery = useQuery({
    queryKey: generateQueryKey.chats(teamSlug ?? "", chatQueryParams ?? {}),
    queryFn: () =>
      chatActions.getSecurityChats(teamSlug!, chatQueryParams!).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: isEnabled && !!chatQueryParams && !!teamSlug,
  });

  const findingContext = useMemo(() => {
    const attributes = context?.attributes ?? [];
    const findings = findingsQuery.data ?? [];
    const ids = new Set(attributes.filter((a) => a.type === "finding").map((a) => a.id));
    return findings.filter((f) => ids.has(f.id));
  }, [context?.attributes, findingsQuery.data]);

  const showFindingTools = isAnalysisWorkspaceRoute || isAnalysisCodeSubroute;

  if (!context || !isEnabled) return null;

  const isOwner = nodeId ? (analysisQuery.data?.is_owner ?? null) : true;
  if (isOwner === false) return null;

  const {
    isExpanded,
    toggleExpanded,
    showSettings,
    setShowSettings,
    selectedChatId,
    isMaximized,
    toggleMaximized,
    removeFinding,
    createChatMutation,
  } = context;

  if (!isExpanded) {
    return (
      <aside
        className="shrink-0 flex flex-col items-center justify-center bg-background border-l border-border"
        style={{ width: "5rem" }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleExpanded}
          title="Expand chat"
          className="size-full flex flex-col gap-2"
        >
          <MessageSquare className="size-4 text-muted-foreground" />
          <KbdGroup>
            <Kbd>⌘ + L</Kbd>
          </KbdGroup>
        </Button>
      </aside>
    );
  }

  return (
    <aside
      className={`shrink-0 flex flex-col min-h-0 bg-background border-l border-border overflow-hidden ${
        isMaximized
          ? "fixed right-0 z-50 shadow-2xl"
          : "sticky top-header self-start h-[calc(100svh-var(--spacing-header))] max-h-[calc(100svh-var(--spacing-header))]"
      }`}
      style={
        isMaximized
          ? {
              width: "50vw",
              maxWidth: "48rem",
              top: "var(--spacing-header)",
              height: "calc(100svh - var(--spacing-header))",
            }
          : { width: CHAT_PANEL_WIDTH }
      }
    >
      <div className="flex items-center gap-1 px-2 h-subheader border-b border-border shrink-0 justify-end">
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => createChatMutation.mutate()}
            disabled={createChatMutation.isPending}
            title="New chat"
          >
            <Plus className="size-4" />
          </Button>
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
      </div>

      {showSettings || !selectedChatId ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ChatThreads chatsQuery={chatsQuery} />
        </div>
      ) : (
        <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
          {codeVersionId ? (
            <ChatMessages
              teamSlug={teamSlug!}
              codeId={codeVersionId}
              findingContext={showFindingTools ? findingContext : undefined}
              availableFindings={showFindingTools ? (findingsQuery.data ?? []) : undefined}
              onRemoveFindingFromContext={showFindingTools ? removeFinding : undefined}
              maxWidth={CHAT_PANEL_WIDTH}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Loader className="size-5" />
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export default GlobalChatPanel;
