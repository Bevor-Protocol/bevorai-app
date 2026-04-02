"use client";

import { authActions, tokenActions } from "@/actions/bevor";
import { ActivitySchema, InviteSchema } from "@/types/api/responses/business";
import { ChatIndex } from "@/types/api/responses/chat";
import {
  isPubSubMessageType,
  type FindingEventData,
  type PubSubMessage,
  type PubSubMessageType,
} from "@/types/api/events";
import { ChatFullSchema, CodeMappingSchema } from "@/types/api/responses/graph";
import {
  AnalysisNodeIndex,
  AnalysisNodeSchema,
  FindingLevelEnum,
  FindingSchema,
  FindingStatusEnum,
  ScopeSchema,
} from "@/types/api/responses/security";
import { Pagination } from "@/types/api/responses/shared";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SSEClaims = {
  team_slug?: string | null;
};

type Subscription = {
  id: string;
  eventType: PubSubMessageType;
  onMessage: (payload: PubSubMessage) => void;
};

type SSEContextValue = {
  subscribe: (eventType: PubSubMessageType, onMessage: (payload: PubSubMessage) => void) => string;
  unsubscribe: (subscriptionId: string) => void;
  disconnect: () => void;
  updateClaims: (claims: SSEClaims) => void;
  clearClaims: () => void;
  setClaims: (claims: SSEClaims) => void;
  getClaims: () => SSEClaims;
  registerCallback: (
    eventType: PubSubMessageType,
    entityId: string,
    callback: (payload: PubSubMessage) => void,
  ) => () => void;
  isConnected: boolean;
  isConnecting: boolean;
  error: Event | Error | null;
};

const SSEContext = React.createContext<SSEContextValue | undefined>(undefined);

const deriveClaimsFromPath = (params: { teamSlug?: string | string[] }): SSEClaims => {
  const claims: SSEClaims = {};
  if (params.teamSlug && typeof params.teamSlug === "string") {
    claims.team_slug = params.teamSlug;
  }
  return claims;
};

function parsePubSubMessage(eventType: string, rawData: string): PubSubMessage | null {
  if (!isPubSubMessageType(eventType)) return null;
  if (eventType === "shutdown") {
    return { type: "shutdown", data: null };
  }
  let body: { data: unknown };
  try {
    body = JSON.parse(rawData);
  } catch {
    return null;
  }
  return { type: eventType, data: body.data } as PubSubMessage;
}

function callbackKeysForMessage(msg: PubSubMessage): string[] {
  if (msg.type === "shutdown") return [];
  if (msg.type === "analysis.scope") {
    return [`analysis.scope:${msg.data.analysis_id}`, `analysis.scope:${msg.data.id}`];
  }
  if (msg.data && typeof msg.data === "object" && "id" in msg.data) {
    return [`${msg.type}:${(msg.data as { id: string }).id}`];
  }
  return [];
}

const findingEventToSchema = (f: FindingEventData, node: AnalysisNodeSchema): FindingSchema => ({
  type: f.type,
  level: f.level,
  name: f.name,
  explanation: f.explanation,
  recommendation: f.recommendation,
  reference: f.reference,
  id: f.id,
  team_id: node.team_id,
  team_slug: node.team_slug,
  project_id: node.project_id,
  project_slug: node.project_slug,
  analysis_id: node.id,
  code_version_id: node.code_version_id,
  node_id: f.source_node_id,
  user_id: node.user.id,
  status: FindingStatusEnum.UNRESOLVED,
  locations: f.locations.map((loc) => ({ source_node_id: loc })),
  source_node_id: f.source_node_id,
});

export const SSEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const params = useParams();
  const [baseUrl, setBaseUrl] = useState("");
  const queryClient = useQueryClient();

  const eventSourceRef = useRef<EventSource | null>(null);
  const subscriptionsRef = useRef<Map<string, Subscription>>(new Map());
  const callbacksRef = useRef<Map<string, (payload: PubSubMessage) => void>>(new Map());
  const [claims, setClaimsState] = useState<SSEClaims>({});
  const claimsRef = useRef<SSEClaims>({});
  const queryClientRef = useRef(queryClient);
  const previousPathClaimsRef = useRef<string>("");
  const connectedClaimsRef = useRef<string>("");
  const isConnectedRef = useRef<boolean>(false);
  const isConnectingRef = useRef<boolean>(false);
  const errorRef = useRef<Event | Error | null>(null);

  useEffect(() => {
    claimsRef.current = claims;
  }, [claims]);

  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  useEffect(() => {
    authActions.getBaseUrl().then((url) => setBaseUrl(url + "/business/events/handler"));
  }, []);

  const disconnect = useCallback((): void => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    isConnectedRef.current = false;
    isConnectingRef.current = false;
  }, []);

  const connect = useCallback(
    async (claimsToUse: SSEClaims): Promise<void> => {
      if (!baseUrl) return;

      disconnect();

      isConnectingRef.current = true;
      errorRef.current = null;

      try {
        const cleanedClaims: Record<string, string> = {};
        Object.entries(claimsToUse).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            cleanedClaims[key] = value;
          }
        });

        const token = await tokenActions.issueSSEToken(cleanedClaims).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        });
        const eventSource = new EventSource(`${baseUrl}?token=${token}`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = (): void => {
          isConnectedRef.current = true;
          isConnectingRef.current = false;
        };

        eventSource.onerror = (err): void => {
          isConnectingRef.current = false;
          disconnect();
          errorRef.current = err;
        };

        const routeToSubscribers = (event: MessageEvent): void => {
          if (!event.type) return;

          const msg = parsePubSubMessage(event.type, event.data as string);
          if (!msg) return;

          if (msg.type === "shutdown") {
            disconnect();
            void connect(claimsRef.current);
            return;
          }

          subscriptionsRef.current.forEach((sub) => {
            if (sub.eventType === msg.type) {
              sub.onMessage(msg);
            }
          });

          for (const key of callbackKeysForMessage(msg)) {
            const callback = callbacksRef.current.get(key);
            if (callback) {
              callback(msg);
            }
          }

          applyGlobalCacheHandlers(queryClientRef.current, msg);
        };

        eventSource.onmessage = routeToSubscribers;

        (
          [
            "chat.title",
            "team.invite",
            "code.status",
            "analysis.new",
            "analysis.status",
            "analysis.scope",
            "activity.new",
            "shutdown",
          ] as const
        ).forEach((eventType) => {
          eventSource.addEventListener(eventType, routeToSubscribers);
        });
      } catch (err) {
        isConnectingRef.current = false;
        errorRef.current = err instanceof Error ? err : new Error("Failed to connect");
      }
    },
    [baseUrl, disconnect],
  );

  const paramsKey = useMemo(() => JSON.stringify(params), [params]);

  useEffect(() => {
    if (!baseUrl) return;

    const pathClaims = deriveClaimsFromPath(params);
    const pathClaimsKey = JSON.stringify(pathClaims);

    if (pathClaimsKey !== previousPathClaimsRef.current) {
      previousPathClaimsRef.current = pathClaimsKey;
      setClaimsState(pathClaims);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, paramsKey]);

  useEffect(() => {
    if (!baseUrl) return;

    const claimsKey = JSON.stringify(claims);

    if (claimsKey !== connectedClaimsRef.current) {
      connectedClaimsRef.current = claimsKey;
      void connect(claims);
    }
  }, [baseUrl, claims, connect]);

  useEffect(() => {
    return (): void => disconnect();
  }, [disconnect]);

  useEffect(() => {
    const closeConnection = (): void => {
      disconnect();
    };
    window.addEventListener("beforeunload", closeConnection);
    window.addEventListener("pagehide", closeConnection);
    return (): void => {
      window.removeEventListener("beforeunload", closeConnection);
      window.removeEventListener("pagehide", closeConnection);
    };
  }, [disconnect]);

  const subscribe = useCallback(
    (eventType: PubSubMessageType, onMessage: (payload: PubSubMessage) => void): string => {
      const subscriptionId = `sub-${Date.now()}-${Math.random()}`;
      const subscription: Subscription = {
        id: subscriptionId,
        eventType,
        onMessage,
      };
      subscriptionsRef.current.set(subscriptionId, subscription);
      return subscriptionId;
    },
    [],
  );

  const unsubscribe = useCallback((subscriptionId: string): void => {
    subscriptionsRef.current.delete(subscriptionId);
  }, []);

  const updateClaims = useCallback((newClaims: SSEClaims): void => {
    setClaimsState((prev) => ({ ...prev, ...newClaims }));
  }, []);

  const setClaims = useCallback((newClaims: SSEClaims): void => {
    setClaimsState(newClaims);
  }, []);

  const clearClaims = useCallback((): void => {
    setClaimsState({});
  }, []);

  const getClaimsState = useCallback((): SSEClaims => {
    return claims;
  }, [claims]);

  const registerCallback = useCallback(
    (
      eventType: PubSubMessageType,
      entityId: string,
      callback: (payload: PubSubMessage) => void,
    ): (() => void) => {
      const key = `${eventType}:${entityId}`;
      callbacksRef.current.set(key, callback);

      return () => {
        callbacksRef.current.delete(key);
      };
    },
    [],
  );

  const value = useMemo(
    (): SSEContextValue => ({
      subscribe,
      unsubscribe,
      updateClaims,
      setClaims,
      clearClaims,
      disconnect,
      getClaims: getClaimsState,
      registerCallback,
      get isConnected(): boolean {
        return isConnectedRef.current;
      },
      get isConnecting(): boolean {
        return isConnectingRef.current;
      },
      get error(): Event | Error | null {
        return errorRef.current;
      },
    }),
    [
      subscribe,
      unsubscribe,
      updateClaims,
      setClaims,
      clearClaims,
      disconnect,
      getClaimsState,
      registerCallback,
    ],
  );

  return <SSEContext.Provider value={value}>{children}</SSEContext.Provider>;
};

export const useSSE = (): SSEContextValue => {
  const context = React.useContext(SSEContext);
  if (context === undefined) {
    throw new Error("useSSE must be used within SSEProvider");
  }

  return context;
};

function applyGlobalCacheHandlers(queryClient: QueryClient, msg: PubSubMessage): void {
  switch (msg.type) {
    case "analysis.status":
      handleAnalysisStatusUpdate(queryClient, msg);
      break;
    case "analysis.scope":
      handleScopeStatusUpdate(queryClient, msg);
      break;
    case "analysis.new":
      handleAnalysisNewUpdate(queryClient, msg);
      break;
    case "code.status":
      handleCodeStatusUpdate(queryClient, msg);
      break;
    case "chat.title":
      handleChatUpdate(queryClient, msg);
      break;
    case "team.invite":
      handleInviteUpdate(queryClient, msg);
      break;
    case "activity.new":
      handleActivityUpdate(queryClient, msg);
      break;
    default:
      break;
  }
}

const handleAnalysisStatusUpdate = (queryClient: QueryClient, payload: PubSubMessage): void => {
  if (payload.type !== "analysis.status") return;
  const { id, status, team } = payload.data;

  const analysisQuery = generateQueryKey.analysis(id);
  const analysisDetailedQuery = generateQueryKey.analysisDetailed(id);

  queryClient.setQueryData<AnalysisNodeSchema>(analysisDetailedQuery, (oldData) => {
    if (!oldData) return oldData;
    return { ...oldData, status };
  });

  queryClient.setQueryData<AnalysisNodeSchema>(analysisQuery, (oldData) => {
    if (!oldData) return oldData;
    return { ...oldData, status };
  });

  const allActiveListQueries = queryClient.getQueriesData<Pagination<AnalysisNodeIndex>>({
    queryKey: [QUERY_KEYS.ANALYSES, team.slug],
    stale: false,
  });

  allActiveListQueries.forEach(([queryKey, data]) => {
    if (!data) return;
    const itemExists = data.results.some((item) => item.id === id);
    if (itemExists) {
      queryClient.setQueryData<Pagination<AnalysisNodeIndex>>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          results: oldData.results.map((item) => (item.id === id ? { ...item, status } : item)),
        };
      });
    }
  });
};

const handleAnalysisNewUpdate = (queryClient: QueryClient, payload: PubSubMessage): void => {
  if (payload.type !== "analysis.new") return;
  void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ANALYSES] });
};

const handleScopeStatusUpdate = (queryClient: QueryClient, payload: PubSubMessage): void => {
  if (payload.type !== "analysis.scope") return;
  const { id: scopeNodeId, analysis_id, team, status, findings: rawFindings } = payload.data;
  const findings = rawFindings ?? [];

  const analysisQuery = generateQueryKey.analysis(analysis_id);
  const analysisDetailedQuery = generateQueryKey.analysisDetailed(analysis_id);

  queryClient.setQueryData<AnalysisNodeSchema>(analysisQuery, (oldData) => {
    if (!oldData) return oldData;
    return {
      ...oldData,
      n_findings: oldData.n_findings + findings.length,
    };
  });

  queryClient.setQueryData<AnalysisNodeSchema>(analysisDetailedQuery, (oldData) => {
    if (!oldData) return oldData;

    const updatedScopes = oldData.scopes.map((scope) =>
      scope.id === scopeNodeId ? { ...scope, status } : scope,
    );

    const newFindingRows = findings.map((f) => findingEventToSchema(f, oldData));
    const updatedFindings = oldData.findings.concat(newFindingRows);

    const scoreMap: Record<FindingLevelEnum, number> = {
      [FindingLevelEnum.CRITICAL]: 6,
      [FindingLevelEnum.HIGH]: 4,
      [FindingLevelEnum.MEDIUM]: 2,
      [FindingLevelEnum.LOW]: 1,
    };

    const scopeScoreMap = new Map<string, number>();
    for (const finding of updatedFindings) {
      const score = scoreMap[finding.level] || 0;
      const currentScore = scopeScoreMap.get(finding.source_node_id) || 0;
      scopeScoreMap.set(finding.source_node_id, currentScore + score);
    }

    const scopesWithScore: [ScopeSchema, number][] = updatedScopes.map((scope) => [
      scope,
      scopeScoreMap.get(scope.source_node_id) || 0,
    ]);

    scopesWithScore.sort((a, b) => b[1] - a[1]);
    const sortedScopes = scopesWithScore.map((s) => s[0]);

    return {
      ...oldData,
      n_findings: oldData.n_findings + findings.length,
      scopes: sortedScopes,
      findings: updatedFindings,
    };
  });

  const allActiveListQueries = queryClient.getQueriesData<Pagination<AnalysisNodeIndex>>({
    queryKey: [QUERY_KEYS.ANALYSES, team.slug],
    stale: false,
  });

  const delta = findings.length;
  allActiveListQueries.forEach(([queryKey, data]) => {
    if (!data) return;
    const itemExists = data.results.some((item) => item.id === analysis_id);
    if (itemExists) {
      queryClient.setQueryData<Pagination<AnalysisNodeIndex>>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          results: oldData.results.map((item) =>
            item.id === analysis_id ? { ...item, n_findings: item.n_findings + delta } : item,
          ),
        };
      });
    }
  });
};

const handleCodeStatusUpdate = (queryClient: QueryClient, payload: PubSubMessage): void => {
  if (payload.type !== "code.status") return;
  const { id, status, team } = payload.data;

  const codeQuery = generateQueryKey.code(id);

  queryClient.setQueryData<CodeMappingSchema>(codeQuery, (oldData) => {
    if (!oldData) return oldData;
    return { ...oldData, status };
  });

  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CODES, id], refetchType: "all" });

  const allActiveListQueries = queryClient.getQueriesData<Pagination<CodeMappingSchema>>({
    queryKey: [QUERY_KEYS.CODES, team.slug],
    stale: false,
  });

  allActiveListQueries.forEach(([queryKey, data]) => {
    if (!data) return;
    const itemExists = data.results.some((item) => item.id === id);
    if (itemExists) {
      queryClient.setQueryData<Pagination<CodeMappingSchema>>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          results: oldData.results.map((item) => (item.id === id ? { ...item, status } : item)),
        };
      });
    }
  });
};

const handleInviteUpdate = (queryClient: QueryClient, payload: PubSubMessage): void => {
  if (payload.type !== "team.invite") return;
  const inviteQuery = generateQueryKey.userInvites();
  queryClient.setQueryData<InviteSchema[]>(inviteQuery, (oldData) => {
    const row = payload.data as InviteSchema;
    if (!oldData) return [row];
    return [...oldData, row];
  });
};

const handleChatUpdate = (queryClient: QueryClient, payload: PubSubMessage): void => {
  if (payload.type !== "chat.title") return;
  const { id, title, team } = payload.data;

  const chatQuery = generateQueryKey.chat(id);
  queryClient.setQueryData<ChatFullSchema>(chatQuery, (oldData) => {
    if (!oldData) return oldData;
    return { ...oldData, title };
  });

  const allChatsQueries = queryClient.getQueriesData<Pagination<ChatIndex>>({
    queryKey: [QUERY_KEYS.CHATS, team.slug],
    stale: false,
  });

  allChatsQueries.forEach(([queryKey, data]) => {
    if (!data) return;
    const itemExists = data.results.some((item) => item.id === id);
    if (itemExists) {
      queryClient.setQueryData<Pagination<ChatIndex>>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          results: oldData.results.map((item) => (item.id === id ? { ...item, title } : item)),
        };
      });
    }
  });
};

const handleActivityUpdate = (queryClient: QueryClient, payload: PubSubMessage): void => {
  if (payload.type !== "activity.new") return;
  if (payload.data.team_slug) {
    const teamQuery = generateQueryKey.teamActivities(payload.data.team_slug);
    queryClient.setQueryData<ActivitySchema[]>(teamQuery, (oldData) => {
      if (!oldData) return [payload.data];
      return [...oldData, payload.data];
    });
  }
  if (payload.data.project_slug) {
    const projectQuery = generateQueryKey.projectActivities(payload.data.project_slug);
    queryClient.setQueryData<ActivitySchema[]>(projectQuery, (oldData) => {
      if (!oldData) return [payload.data];
      return [...oldData, payload.data];
    });
  }
};
