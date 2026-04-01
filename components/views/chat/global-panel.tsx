"use client";

import { analysisActions, chatActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Loader } from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOptionalChat } from "@/providers/chat";
import { useChatSelectorContext } from "@/providers/global-chat";
import { FindingSchema } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { formatDate, truncateId } from "@/utils/helpers";
import { extractQueryParams } from "@/utils/query-params";
import { useQuery } from "@tanstack/react-query";
import { History, Maximize2, MessageSquare, Minimize2, X } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import React, { useMemo } from "react";
import { ChatMessages } from "./messages";
import ChatThreads from "./threads";

const CHAT_PANEL_WIDTH = "24rem";

const GlobalChatPanel: React.FC = () => {
  const context = useOptionalChat();
  const selectorCtx = useChatSelectorContext();
  const params = useParams();
  const pathname = usePathname();

  const teamSlug = (params.teamSlug as string) || null;
  const projectSlug = (params.projectSlug as string) || null;
  const nodeId = (params.nodeId as string) || null;
  const urlCodeId = (params.codeId as string) || null;

  const isAnalysisCodeSubroute = !!nodeId && pathname.endsWith("/code");
  const isAnalysisRoute = !!nodeId && !isAnalysisCodeSubroute;
  const isProjectRoute =
    !!teamSlug && !!projectSlug && !nodeId && !urlCodeId &&
    pathname === `/team/${teamSlug}/${projectSlug}`;
  const isKanbanRoute =
    !!teamSlug && !!projectSlug && !nodeId && !urlCodeId &&
    pathname === `/team/${teamSlug}/${projectSlug}/kanban`;
  const isTeamRoute =
    !!teamSlug && !projectSlug && !nodeId && !urlCodeId &&
    pathname === `/team/${teamSlug}`;
  const isSelectorRoute = isProjectRoute || isKanbanRoute || isTeamRoute;

  const isEnabled = !!(context && teamSlug && (nodeId || urlCodeId || isSelectorRoute));

  // Effective project slug: from URL on project routes, from selector on team routes
  const effectiveProjectSlug = isTeamRoute
    ? (selectorCtx?.selectedProjectSlug ?? null)
    : projectSlug;

  // Analysis ownership (for analysis-route pages)
  const analysisQuery = useQuery({
    queryKey: generateQueryKey.analysis(nodeId ?? ""),
    queryFn: () =>
      analysisActions.getAnalysis(teamSlug!, nodeId!).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: isEnabled && !!nodeId,
  });

  // Findings (analysis + selector routes)
  const effectiveNodeId = nodeId ?? context?.analysisNodeId ?? null;
  const findingsQuery = useQuery({
    queryKey: generateQueryKey.analysisFindings(effectiveNodeId ?? ""),
    queryFn: () =>
      analysisActions.getAnalysisFindings(teamSlug!, effectiveNodeId!).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: isEnabled && !!(isAnalysisRoute || isSelectorRoute) && !!effectiveNodeId,
  });

  const codeId = context?.codeId ?? null;
  const analysisId = context?.analysisNodeId ?? null;

  const chatQueryParams = useMemo(() => {
    if (!effectiveProjectSlug || !codeId) return null;
    return extractQueryParams({
      project_slug: effectiveProjectSlug,
      code_version_id: codeId,
      ...(analysisId ? { analysis_id: analysisId } : {}),
      chat_type: context?.chatType,
    });
  }, [effectiveProjectSlug, codeId, analysisId, context?.chatType]);

  const chatsQuery = useQuery({
    queryKey: generateQueryKey.chats(teamSlug ?? "", chatQueryParams ?? {}),
    queryFn: () =>
      (context?.chatType === "analysis"
        ? chatActions.getSecurityChats(teamSlug!, chatQueryParams!)
        : chatActions.getCodeChats(teamSlug!, chatQueryParams!)
      ).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: isEnabled && !!chatQueryParams && !!teamSlug,
  });

  const findings: FindingSchema[] = findingsQuery.data ?? [];
  const attributes = context?.attributes ?? [];
  const findingContext = useMemo(() => {
    const ids = new Set(attributes.filter((a) => a.type === "finding").map((a) => a.id));
    return findings.filter((f) => ids.has(f.id));
  }, [attributes, findings]);

  if (!context || !isEnabled) return null;

  // On team route: wait for a project to be selected before showing anything useful
  if (isTeamRoute && !selectorCtx?.selectedProjectSlug && !selectorCtx?.isLoading) {
    return null;
  }

  // Ownership check for analysis-only routes
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

  const hasSelectors = isSelectorRoute && !!selectorCtx;
  const hasProjectSelector = isTeamRoute && selectorCtx && selectorCtx.projects.length > 0;
  const hasAnalysisSelector = hasSelectors && selectorCtx.analyses.length > 0;

  return (
    <aside
      className={`shrink-0 flex flex-col min-h-0 bg-background border-l border-border overflow-hidden ${
        isMaximized ? "fixed right-0 z-50 shadow-2xl" : ""
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
      {/* ── Panel header ── */}
      <div className="flex items-center gap-1 px-2 h-subheader border-b border-border shrink-0">
        {/* Selectors fill available space */}
        {hasSelectors && (
          <div className="flex flex-1 min-w-0 items-center gap-1 overflow-hidden">
            {hasProjectSelector && (
              <Select
                value={selectorCtx.selectedProjectSlug ?? ""}
                onValueChange={selectorCtx.setSelectedProjectSlug}
              >
                <SelectTrigger className="h-7 text-xs border-0 bg-transparent focus:ring-0 px-1 flex-1 min-w-0">
                  <SelectValue placeholder="Project…" />
                </SelectTrigger>
                <SelectContent>
                  {selectorCtx.projects.map((p) => (
                    <SelectItem key={p.slug} value={p.slug}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {hasAnalysisSelector && (
              <Select
                value={selectorCtx.selectedNodeId ?? ""}
                onValueChange={selectorCtx.setSelectedNodeId}
              >
                <SelectTrigger className="h-7 text-xs border-0 bg-transparent focus:ring-0 px-1 flex-1 min-w-0">
                  <SelectValue placeholder="Analysis…" />
                </SelectTrigger>
                <SelectContent>
                  {selectorCtx.analyses.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="font-mono">{truncateId(a.id)}</span>
                      <span className="ml-2 text-muted-foreground">{formatDate(a.created_at)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectorCtx.isLoading && <Loader className="size-3 mx-2" />}
          </div>
        )}

        {/* Controls pushed to the right */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
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

      {/* ── Panel body ── */}
      {showSettings || !selectedChatId ? (
        <ChatThreads chatsQuery={chatsQuery} />
      ) : (
        <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
          {codeId ? (
            <ChatMessages
              teamSlug={teamSlug!}
              codeId={codeId}
              findingContext={isAnalysisRoute || isSelectorRoute ? findingContext : undefined}
              availableFindings={isAnalysisRoute || isSelectorRoute ? findings : undefined}
              onRemoveFindingFromContext={
                isAnalysisRoute || isSelectorRoute ? removeFinding : undefined
              }
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
