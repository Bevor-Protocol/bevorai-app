"use client";

import { analysisActions, projectActions } from "@/actions/bevor";
import { ChatProvider, ChatType } from "@/providers/chat";
import { ProjectDetailedSchema } from "@/types/api/responses/business";
import { AnalysisNodeIndex } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

// ─── Selector context (team + project routes) ─────────────────────────────────

export interface ChatSelectorContextValue {
  /** Only populated on team routes */
  projects: ProjectDetailedSchema[];
  selectedProjectSlug: string | null;
  setSelectedProjectSlug: (slug: string) => void;
  /** Populated on both team and project routes */
  analyses: AnalysisNodeIndex[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string) => void;
  isLoading: boolean;
}

const ChatSelectorContext = createContext<ChatSelectorContextValue | null>(null);

export const useChatSelectorContext = (): ChatSelectorContextValue | null =>
  useContext(ChatSelectorContext);

// ─── Route helpers ─────────────────────────────────────────────────────────────

const useRouteKind = (
  teamSlug: string | null,
  projectSlug: string | null,
  nodeId: string | null,
  urlCodeId: string | null,
  pathname: string,
): {
  isAnalysisCodeSubroute: boolean;
  isAnalysisRoute: boolean;
  isDirectCodeRoute: boolean;
  isProjectRoute: boolean;
  isKanbanRoute: boolean;
  isTeamRoute: boolean;
} => {
  const isAnalysisCodeSubroute = !!nodeId && pathname.endsWith("/code");
  const isAnalysisRoute = !!nodeId && !isAnalysisCodeSubroute;
  const isDirectCodeRoute = !!urlCodeId && !nodeId;
  const isProjectRoute =
    !!teamSlug &&
    !!projectSlug &&
    !nodeId &&
    !urlCodeId &&
    pathname === `/team/${teamSlug}/${projectSlug}`;
  const isKanbanRoute =
    !!teamSlug &&
    !!projectSlug &&
    !nodeId &&
    !urlCodeId &&
    pathname === `/team/${teamSlug}/${projectSlug}/kanban`;
  const isTeamRoute =
    !!teamSlug && !projectSlug && !nodeId && !urlCodeId && pathname === `/team/${teamSlug}`;

  return {
    isAnalysisCodeSubroute,
    isAnalysisRoute,
    isDirectCodeRoute,
    isProjectRoute,
    isKanbanRoute,
    isTeamRoute,
  };
};

// ─── Provider ──────────────────────────────────────────────────────────────────

export const GlobalChatWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const teamSlug = (params.teamSlug as string) || null;
  const projectSlug = (params.projectSlug as string) || null;
  const nodeId = (params.nodeId as string) || null;
  const urlCodeId = (params.codeId as string) || null;

  const {
    isAnalysisCodeSubroute,
    isAnalysisRoute,
    isDirectCodeRoute,
    isProjectRoute,
    isKanbanRoute,
    isTeamRoute,
  } = useRouteKind(teamSlug, projectSlug, nodeId, urlCodeId, pathname);

  const needsSelector = isProjectRoute || isKanbanRoute || isTeamRoute;
  const chatType: ChatType =
    isAnalysisRoute || isProjectRoute || isKanbanRoute || isTeamRoute ? "analysis" : "code";

  const isEnabled = !!(
    teamSlug &&
    (isAnalysisRoute ||
      isAnalysisCodeSubroute ||
      isDirectCodeRoute ||
      isProjectRoute ||
      isKanbanRoute ||
      isTeamRoute)
  );

  // ── Analysis-route data (already in cache on the analysis page) ──
  const analysisQuery = useQuery({
    queryKey: generateQueryKey.analysis(nodeId ?? ""),
    queryFn: () =>
      analysisActions.getAnalysis(teamSlug!, nodeId!).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: isEnabled && !!nodeId,
  });

  // ── Team-route: projects list ──
  const [selectedProjectSlug, setSelectedProjectSlug] = useState<string | null>(null);

  const projectsQuery = useQuery({
    queryKey: generateQueryKey.projects(teamSlug ?? "", { page_size: "50" }),
    queryFn: () =>
      projectActions.getProjects(teamSlug!, { page_size: "50" }).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: isTeamRoute && !!teamSlug,
  });

  // Auto-select first project on team route
  useEffect(() => {
    const projects = projectsQuery.data?.results ?? [];
    if (isTeamRoute && projects.length > 0 && !selectedProjectSlug) {
      setSelectedProjectSlug(projects[0].slug);
    }
  }, [isTeamRoute, projectsQuery.data?.results, selectedProjectSlug]);

  // Reset on route change
  useEffect(() => {
    if (!isTeamRoute) setSelectedProjectSlug(null);
  }, [isTeamRoute]);

  // ── Project slug used for analyses query ──
  const effectiveProjectSlug = isTeamRoute ? selectedProjectSlug : projectSlug;

  // ── Analyses list (project or team route) ──
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectorAnalysesQuery = useQuery({
    queryKey: generateQueryKey.analyses(teamSlug ?? "", {
      project_slug: effectiveProjectSlug ?? "",
      page_size: "20",
    }),
    queryFn: () =>
      analysisActions
        .getAnalyses(teamSlug!, { project_slug: effectiveProjectSlug!, page_size: 20 })
        .then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    enabled: needsSelector && !!teamSlug && !!effectiveProjectSlug,
  });

  const selectorAnalyses = (selectorAnalysesQuery.data?.results ?? []) as AnalysisNodeIndex[];

  // Auto-select latest analysis; reset when project or route changes
  useEffect(() => {
    if (needsSelector) {
      setSelectedNodeId(selectorAnalyses.length > 0 ? selectorAnalyses[0].id : null);
    }
  }, [needsSelector, effectiveProjectSlug, selectorAnalyses.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!needsSelector) setSelectedNodeId(null);
  }, [needsSelector]);

  // ── Resolve final ChatProvider values ──
  const resolvedAnalysisNodeId = needsSelector ? selectedNodeId : isAnalysisRoute ? nodeId : null;

  const resolvedProjectSlug = (isTeamRoute ? selectedProjectSlug : projectSlug) ?? "";

  const resolvedSelectedAnalysis = needsSelector
    ? selectorAnalyses.find((a) => a.id === selectedNodeId)
    : null;

  const resolvedCodeId =
    urlCodeId ??
    analysisQuery.data?.code_version_id ??
    resolvedSelectedAnalysis?.code_version_id ??
    null;

  const initialChatId = searchParams.get("chatId");

  if (!isEnabled || !teamSlug) {
    return <>{children}</>;
  }

  const providerKey = `${resolvedAnalysisNodeId ?? nodeId ?? urlCodeId ?? "none"}-${chatType}-${resolvedProjectSlug}`;

  const inner = (
    <ChatProvider
      key={providerKey}
      teamSlug={teamSlug}
      projectSlug={resolvedProjectSlug}
      chatType={chatType}
      codeId={resolvedCodeId}
      analysisNodeId={resolvedAnalysisNodeId}
      initialChatId={initialChatId}
    >
      {children}
    </ChatProvider>
  );

  if (needsSelector) {
    return (
      <ChatSelectorContext.Provider
        value={{
          projects: projectsQuery.data?.results ?? [],
          selectedProjectSlug,
          setSelectedProjectSlug: (slug) => {
            setSelectedProjectSlug(slug);
            setSelectedNodeId(null); // reset analysis when project changes
          },
          analyses: selectorAnalyses,
          selectedNodeId,
          setSelectedNodeId,
          isLoading: projectsQuery.isLoading || selectorAnalysesQuery.isLoading,
        }}
      >
        {inner}
      </ChatSelectorContext.Provider>
    );
  }

  return inner;
};
