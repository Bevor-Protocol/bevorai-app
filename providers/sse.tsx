"use client";

import { authActions, tokenActions } from "@/actions/bevor";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import {
  ActivitySchemaI,
  AnalysisNodeSchemaI,
  AnalysisVersionPaginationI,
  CodeMappingSchemaI,
  CodeVersionsPaginationI,
  FindingSchemaI,
  MemberInviteSchema,
} from "@/utils/types";
import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type EventType = "activity" | "code" | "invite" | "analysis" | "scope";

const ALL_EVENT_TYPES: EventType[] = ["activity", "code", "invite", "analysis", "scope"];

type ClaimType = "user" | "team" | "project" | "analysis" | "code" | "chat";

export type SSEClaims = {
  team_slug?: string | null;
  project_slug?: string | null;
  code_version_id?: string | null;
  analysis_node_id?: string | null;
  chat_id?: string | null;
};

// after the event.data is parsed.
export type SSEPayload = {
  id: string;
  claim: ClaimType;
  data: any;
};

type Subscription = {
  id: string;
  eventType: EventType;
  claim: ClaimType;
  onMessage: (payload: SSEPayload) => void;
};

type SSEContextValue = {
  subscribe: (
    eventType: EventType,
    claim: ClaimType,
    onMessage: (payload: SSEPayload) => void,
  ) => string;
  unsubscribe: (subscriptionId: string) => void;
  disconnect: () => void;
  updateClaims: (claims: SSEClaims) => void;
  clearClaims: () => void;
  setClaims: (claims: SSEClaims) => void;
  getClaims: () => SSEClaims;
  registerCallback: (
    eventType: EventType,
    claim: ClaimType,
    id: string,
    callback: (payload: SSEPayload) => void,
  ) => () => void;
  isConnected: boolean;
  isConnecting: boolean;
  error: Event | Error | null;
};

const SSEContext = React.createContext<SSEContextValue | undefined>(undefined);

const deriveClaimsFromPath = (params: {
  teamSlug?: string | string[];
  projectSlug?: string | string[];
  codeId?: string | string[];
  nodeId?: string | string[];
  chatId?: string | string[];
}): SSEClaims => {
  const claims: SSEClaims = {};

  if (params.teamSlug && typeof params.teamSlug === "string") {
    claims.team_slug = params.teamSlug;
  }
  if (params.projectSlug && typeof params.projectSlug === "string") {
    claims.project_slug = params.projectSlug;
  }
  if (params.codeId && typeof params.codeId === "string") {
    claims.code_version_id = params.codeId;
  }
  if (params.nodeId && typeof params.nodeId === "string") {
    claims.analysis_node_id = params.nodeId;
  }
  if (params.chatId && typeof params.chatId === "string") {
    claims.chat_id = params.chatId;
  }

  return claims;
};

export const SSEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const params = useParams();
  const [baseUrl, setBaseUrl] = useState("");
  const queryClient = useQueryClient();

  const eventSourceRef = useRef<EventSource | null>(null);
  const subscriptionsRef = useRef<Map<string, Subscription>>(new Map());
  const callbacksRef = useRef<Map<string, (payload: SSEPayload) => void>>(new Map());
  const [claims, setClaimsState] = useState<SSEClaims>({});
  const previousPathClaimsRef = useRef<string>("");
  const connectedClaimsRef = useRef<string>("");
  const isConnectedRef = useRef<boolean>(false);
  const isConnectingRef = useRef<boolean>(false);
  const errorRef = useRef<Event | Error | null>(null);

  useEffect(() => {
    authActions.getBaseUrl().then((url) => setBaseUrl(url + "/events/handler"));
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
          if (value !== null && value !== undefined) {
            cleanedClaims[key] = value;
          }
        });
        const token = await tokenActions.issueSSEToken(cleanedClaims);
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
          let parsed: SSEPayload;
          try {
            parsed = JSON.parse(event.data);
          } catch {
            return;
          }

          if (!event.type) {
            return;
          }

          const eventType = event.type as EventType;

          subscriptionsRef.current.forEach((sub) => {
            if (sub.eventType === eventType && sub.claim === parsed.claim) {
              sub.onMessage(parsed);
            }
          });

          const callbackKey = `${eventType}:${parsed.claim}:${parsed.id}`;
          const callback = callbacksRef.current.get(callbackKey);
          if (callback) {
            callback(parsed);
          }
        };

        eventSource.onmessage = routeToSubscribers;

        ALL_EVENT_TYPES.forEach((eventType) => {
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
    if (Object.keys(claims).length === 0) return;

    const claimsKey = JSON.stringify(claims);

    if (claimsKey !== connectedClaimsRef.current) {
      connectedClaimsRef.current = claimsKey;
      connect(claims);
    }
  }, [baseUrl, claims, connect]);

  useEffect(() => {
    return (): void => disconnect();
  }, [disconnect]);

  const subscribe = useCallback(
    (eventType: EventType, claim: ClaimType, onMessage: (payload: SSEPayload) => void): string => {
      const subscriptionId = `sub-${Date.now()}-${Math.random()}`;
      const subscription: Subscription = {
        id: subscriptionId,
        eventType,
        claim,
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
      eventType: EventType,
      claim: ClaimType,
      id: string,
      callback: (payload: SSEPayload) => void,
    ): (() => void) => {
      const key = `${eventType}:${claim}:${id}`;
      callbacksRef.current.set(key, callback);

      return () => {
        callbacksRef.current.delete(key);
      };
    },
    [],
  );

  useEffect(() => {
    if (!queryClient) return;
    // Default subscriptions, to be applied globally and automatically update react-query cache.
    // the claim is very important as well. notice most are user/team level, but one is analysis-level.
    // that's because we don't care about this event unless we're specifically on that view.

    const analysisSubId = subscribe("analysis", "team", (payload) => {
      handleAnalysisStatusUpdate(queryClient, payload);
    });

    const scopeSubId = subscribe("scope", "team", (payload) => {
      handleScopeStatusUpdate(queryClient, payload);
    });

    const codeSubId = subscribe("code", "team", (payload) => {
      handleCodeStatusUpdate(queryClient, payload);
    });

    const inviteSubId = subscribe("invite", "user", (payload) => {
      handleInviteUpdate(queryClient, payload);
    });

    const activitySubId = subscribe("activity", "team", (payload) => {
      handleActivityUpdate(queryClient, payload);
    });

    return (): void => {
      unsubscribe(analysisSubId);
      unsubscribe(scopeSubId);
      unsubscribe(inviteSubId);
      unsubscribe(activitySubId);
      unsubscribe(codeSubId);
    };
  }, [queryClient, subscribe, unsubscribe, getClaimsState]);

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

/*
Below are global handlers for SSE events. Within the provider, we can subscribe to these
immediately, for specific events + claims. This means that globally, these will be applied.

If we need more specific callback function on event, we can registerCallback() (and unregister() in a useEffect)
in the component where it's needed.

NOTE: it's important that whatever these invalidate, are on the client. Via useSuspenseQuery() is fine if we still
want to fetch them on the server initially.
*/

const handleAnalysisStatusUpdate = (queryClient: QueryClient, payload: SSEPayload): void => {
  console.log("analysis update payload", payload);

  const analysisQuery = generateQueryKey.analysis(payload.id);
  const analysisDetailedQuery = generateQueryKey.analysisDetailed(payload.id);

  queryClient.setQueryData<AnalysisNodeSchemaI>(analysisDetailedQuery, (oldData) => {
    if (!oldData) return oldData;
    const newData = {
      ...oldData,
      status: payload.data.status,
    };
    return newData;
  });

  queryClient.setQueryData<AnalysisNodeSchemaI>(analysisQuery, (oldData) => {
    if (!oldData) return oldData;
    return {
      ...oldData,
      status: payload.data.status,
    };
  });

  const allActiveListQueries = queryClient.getQueriesData<AnalysisVersionPaginationI>({
    queryKey: [QUERY_KEYS.ANALYSES, payload.data.team_slug],
    stale: false,
  });

  allActiveListQueries.forEach(([queryKey, data]) => {
    if (!data) return;
    const itemExists = data.results.some((item) => item.id === payload.id);
    if (itemExists) {
      queryClient.setQueryData<AnalysisVersionPaginationI>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          results: oldData.results.map((item) =>
            item.id === payload.id ? { ...item, status: payload.data.status } : item,
          ),
        };
      });
    }
  });
};

const handleScopeStatusUpdate = (queryClient: QueryClient, payload: SSEPayload): void => {
  console.log("analysis scope update payload", payload);

  const analysisQuery = generateQueryKey.analysis(payload.data.analysis_node_id);
  const analysisDetailedQuery = generateQueryKey.analysisDetailed(payload.data.analysis_node_id);
  let findings: FindingSchemaI[] = [];
  if (typeof payload.data.findings === "string") {
    try {
      findings = JSON.parse(payload.data.findings);
    } catch {
      findings = [];
    }
  }

  queryClient.setQueryData<AnalysisNodeSchemaI>(analysisQuery, (oldData) => {
    if (!oldData) return oldData;
    return {
      ...oldData,
      n_findings: oldData.n_findings + findings.length,
    };
  });

  queryClient.setQueryData<AnalysisNodeSchemaI>(analysisDetailedQuery, (oldData) => {
    if (!oldData) return oldData;

    const updatedScopes = oldData.scopes.map((scope) =>
      scope.id === payload.id
        ? {
            ...scope,
            status: payload.data.status,
          }
        : scope,
    );

    const updatedFindings = oldData.findings.concat(findings);

    return {
      ...oldData,
      n_findings: oldData.n_findings + findings.length,
      scopes: updatedScopes,
      findings: updatedFindings,
    };
  });

  const allActiveListQueries = queryClient.getQueriesData<AnalysisVersionPaginationI>({
    queryKey: [QUERY_KEYS.ANALYSES, payload.data.team_slug],
    stale: false,
  });

  allActiveListQueries.forEach(([queryKey, data]) => {
    if (!data) return;
    const itemExists = data.results.some((item) => item.id === payload.id);
    if (itemExists) {
      queryClient.setQueryData<AnalysisVersionPaginationI>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          results: oldData.results.map((item) =>
            item.id === payload.id
              ? { ...item, n_findings: item.n_findings + payload.data.n_findings }
              : item,
          ),
        };
      });
    }
  });
};

const handleInviteUpdate = (queryClient: QueryClient, payload: SSEPayload): void => {
  console.log("invite payload", payload);
  const inviteQuery = generateQueryKey.userInvites();
  queryClient.setQueryData<MemberInviteSchema[]>(inviteQuery, (oldData) => {
    if (!oldData) return [payload.data];
    return [...oldData, payload.data];
  });
};

const handleActivityUpdate = (queryClient: QueryClient, payload: SSEPayload): void => {
  console.log("activity payload", payload);
  if (payload.data.team_slug) {
    const teamQuery = generateQueryKey.teamActivities(payload.data.team_slug);
    queryClient.setQueryData<ActivitySchemaI[]>(teamQuery, (oldData) => {
      if (!oldData) return [payload.data];
      return [...oldData, payload.data];
    });
  }
  if (payload.data.project_slug) {
    const projectQuery = generateQueryKey.projectActivities(payload.data.project_slug);
    queryClient.setQueryData<ActivitySchemaI[]>(projectQuery, (oldData) => {
      if (!oldData) return [payload.data];
      return [...oldData, payload.data];
    });
  }
};

const handleCodeStatusUpdate = (queryClient: QueryClient, payload: SSEPayload): void => {
  console.log("code update payload", payload);
  const codeQuery = generateQueryKey.code(payload.id);

  queryClient.setQueryData<CodeMappingSchemaI>(codeQuery, (oldData) => {
    if (!oldData) return oldData;
    return {
      ...oldData,
      version: {
        ...oldData.version,
        status: payload.data.status,
      },
    };
  });

  const allActiveListQueries = queryClient.getQueriesData<CodeVersionsPaginationI>({
    queryKey: [QUERY_KEYS.CODES, payload.data.team_slug],
    stale: false,
  });

  allActiveListQueries.forEach(([queryKey, data]) => {
    if (!data) return;
    const itemExists = data.results.some((item) => item.id === payload.id);
    if (itemExists) {
      queryClient.setQueryData<CodeVersionsPaginationI>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          results: oldData.results.map((item) =>
            item.id === payload.id ? { ...item, status: payload.data.status } : item,
          ),
        };
      });
    }
  });
};
