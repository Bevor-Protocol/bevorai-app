"use client";

import { authActions, tokenActions } from "@/actions/bevor";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type EventType = "activity" | "code" | "invite" | "analysis";

export type SSEClaims = {
  team_slug?: string | null;
  project_slug?: string | null;
  code_version_id?: string | null;
  analysis_thread_id?: string | null;
  analysis_node_id?: string | null;
};

type Subscription = {
  id: string;
  eventTypes: EventType[];
  onMessage: (event: MessageEvent) => void;
  explicitClaims?: SSEClaims;
};

type UseSSEReturn = {
  updateClaims: (claims: SSEClaims) => void;
  setClaims: (claims: SSEClaims) => void;
  clearClaims: () => void;
  disconnect: () => void;
  currentClaims: SSEClaims;
  isConnected: boolean;
  isConnecting: boolean;
  error: Event | Error | null;
};

type SSEContextValue = {
  subscribe: (eventTypes: EventType[], onMessage: (event: MessageEvent) => void) => string;
  unsubscribe: (subscriptionId: string) => void;
  updateSubscriptionClaims: (subscriptionId: string, claims: SSEClaims) => void;
  setSubscriptionClaims: (subscriptionId: string, claims: SSEClaims) => void;
  clearSubscriptionClaims: (subscriptionId: string) => void;
  disconnect: () => void;
  getCurrentClaims: () => SSEClaims;
  isConnected: boolean;
  isConnecting: boolean;
  error: Event | Error | null;
};

const SSEContext = React.createContext<SSEContextValue | undefined>(undefined);

const deriveClaimsFromPath = (params: {
  teamSlug?: string | string[];
  projectSlug?: string | string[];
  codeId?: string | string[];
  threadId?: string | string[];
  nodeId?: string | string[];
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
  if (params.threadId && typeof params.threadId === "string") {
    claims.analysis_thread_id = params.threadId;
  }
  if (params.nodeId && typeof params.nodeId === "string") {
    claims.analysis_node_id = params.nodeId;
  }

  return claims;
};

const mergeClaims = (pathClaims: SSEClaims, explicitClaims: SSEClaims[]): SSEClaims => {
  const merged = { ...pathClaims };

  explicitClaims.forEach((claims) => {
    Object.entries(claims).forEach(([key, value]) => {
      if (value === null) {
        delete merged[key as keyof SSEClaims];
      } else if (value !== undefined) {
        merged[key as keyof SSEClaims] = value;
      }
    });
  });

  return merged;
};

export const SSEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const params = useParams();
  const [baseUrl, setBaseUrl] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Event | Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const subscriptionsRef = useRef<Map<string, Subscription>>(new Map());
  const currentClaimsRef = useRef<SSEClaims>({});
  const previousParamsRef = useRef<string>("");
  const isConnectingRef = useRef<boolean>(false);
  const pendingConnectionRef = useRef<SSEClaims | null>(null);

  useEffect(() => {
    authActions.getBaseUrl().then((url) => setBaseUrl(url + "/events/handler"));
  }, []);

  const disconnect = useCallback((): void => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    isConnectingRef.current = false;
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const connect = useCallback(
    async (claims: SSEClaims): Promise<void> => {
      if (!baseUrl) return;

      const claimsKey = JSON.stringify(claims);
      const currentClaimsKey = JSON.stringify(currentClaimsRef.current);
      if (claimsKey === currentClaimsKey && isConnectingRef.current) {
        return;
      }

      if (isConnectingRef.current) {
        pendingConnectionRef.current = claims;
        return;
      }

      disconnect();

      isConnectingRef.current = true;
      setIsConnecting(true);
      setError(null);

      try {
        const cleanedClaims: Record<string, string> = {};
        Object.entries(claims).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            cleanedClaims[key] = value;
          }
        });
        const token = await tokenActions.issueSSEToken(cleanedClaims);
        const eventSource = new EventSource(`${baseUrl}?token=${token}`);
        eventSourceRef.current = eventSource;
        isConnectingRef.current = false;

        eventSource.onopen = (): void => {
          setIsConnected(true);
          setIsConnecting(false);
          if (pendingConnectionRef.current) {
            const pending = pendingConnectionRef.current;
            pendingConnectionRef.current = null;
            connect(pending);
          }
        };

        eventSource.onerror = (err): void => {
          isConnectingRef.current = false;
          disconnect();
          setError(err);
          if (pendingConnectionRef.current) {
            const pending = pendingConnectionRef.current;
            pendingConnectionRef.current = null;
            connect(pending);
          }
        };

        const handleMessage = (event: MessageEvent): void => {
          console.log("BASE HANDLE MESSAGE", event);
          let parsed;
          try {
            parsed = JSON.parse(event.data);
          } catch {
            parsed = event.data;
          }

          if (parsed === "done") {
            disconnect();
            return;
          }

          if (!event.type) {
            subscriptionsRef.current.forEach((sub) => {
              sub.onMessage(event);
            });
          }
        };

        eventSource.onmessage = handleMessage;

        subscriptionsRef.current.forEach((sub) => {
          sub.eventTypes.forEach((eventType) => {
            const listener = (event: MessageEvent): void => {
              sub.onMessage(event);
            };
            eventSource.addEventListener(eventType, listener);
          });
        });
      } catch (err) {
        isConnectingRef.current = false;
        setIsConnecting(false);
        setError(err instanceof Error ? err : new Error("Failed to connect"));
        if (pendingConnectionRef.current) {
          const pending = pendingConnectionRef.current;
          pendingConnectionRef.current = null;
          connect(pending);
        }
      }
    },
    [baseUrl, disconnect],
  );

  const clearConflictingExplicitClaims = useCallback((pathClaims: SSEClaims): void => {
    subscriptionsRef.current.forEach((sub) => {
      if (sub.explicitClaims) {
        const clearedClaims: SSEClaims = {};
        let hasChanges = false;

        Object.keys(sub.explicitClaims).forEach((key) => {
          const claimKey = key as keyof SSEClaims;
          const explicitValue = sub.explicitClaims?.[claimKey];
          const pathValue = pathClaims[claimKey];

          if (
            explicitValue !== undefined &&
            explicitValue !== null &&
            (pathValue === undefined || pathValue !== explicitValue)
          ) {
            clearedClaims[claimKey] = null;
            hasChanges = true;
          }
        });

        if (hasChanges) {
          sub.explicitClaims = {
            ...sub.explicitClaims,
            ...clearedClaims,
          };
        }
      }
    });
  }, []);

  const paramsKey = useMemo(() => JSON.stringify(params), [params]);

  const updateConnection = useCallback((): void => {
    if (!baseUrl) return;

    const pathClaims = deriveClaimsFromPath(params);
    const paramsChanged = previousParamsRef.current !== paramsKey;

    if (paramsChanged) {
      clearConflictingExplicitClaims(pathClaims);
      previousParamsRef.current = paramsKey;
    }

    const explicitClaims = Array.from(subscriptionsRef.current.values())
      .map((sub) => sub.explicitClaims)
      .filter((claims): claims is SSEClaims => claims !== undefined);

    const mergedClaims = mergeClaims(pathClaims, explicitClaims);
    const claimsKey = JSON.stringify(mergedClaims);
    const currentClaimsKey = JSON.stringify(currentClaimsRef.current);

    if (claimsKey !== currentClaimsKey) {
      currentClaimsRef.current = mergedClaims;
      connect(mergedClaims);
    }
  }, [params, paramsKey, baseUrl, connect, clearConflictingExplicitClaims]);

  useEffect(() => {
    if (baseUrl) {
      updateConnection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, paramsKey]);

  useEffect(() => {
    return (): void => disconnect();
  }, [disconnect]);

  const subscribe = useCallback(
    (eventTypes: EventType[], onMessage: (event: MessageEvent) => void): string => {
      const subscriptionId = `sub-${Date.now()}-${Math.random()}`;
      const subscription: Subscription = {
        id: subscriptionId,
        eventTypes,
        onMessage,
        explicitClaims: undefined,
      };
      subscriptionsRef.current.set(subscriptionId, subscription);
      updateConnection();
      return subscriptionId;
    },
    [updateConnection],
  );

  const unsubscribe = useCallback(
    (subscriptionId: string): void => {
      subscriptionsRef.current.delete(subscriptionId);
      updateConnection();
    },
    [updateConnection],
  );

  const updateSubscriptionClaims = useCallback(
    (subscriptionId: string, claims: SSEClaims): void => {
      const subscription = subscriptionsRef.current.get(subscriptionId);
      if (subscription) {
        subscription.explicitClaims = { ...subscription.explicitClaims, ...claims };
        updateConnection();
      }
    },
    [updateConnection],
  );

  const setSubscriptionClaims = useCallback(
    (subscriptionId: string, claims: SSEClaims): void => {
      const subscription = subscriptionsRef.current.get(subscriptionId);
      if (subscription) {
        subscription.explicitClaims = claims;
        updateConnection();
      }
    },
    [updateConnection],
  );

  const clearSubscriptionClaims = useCallback(
    (subscriptionId: string): void => {
      const subscription = subscriptionsRef.current.get(subscriptionId);
      if (subscription) {
        subscription.explicitClaims = undefined;
        updateConnection();
        disconnect();
      }
    },
    [updateConnection, disconnect],
  );

  const getCurrentClaims = useCallback((): SSEClaims => {
    const pathClaims = deriveClaimsFromPath(params);
    const explicitClaims = Array.from(subscriptionsRef.current.values())
      .map((sub) => sub.explicitClaims)
      .filter((claims): claims is SSEClaims => claims !== undefined);
    return mergeClaims(pathClaims, explicitClaims);
  }, [params]);

  const value = useMemo(
    (): SSEContextValue => ({
      subscribe,
      unsubscribe,
      updateSubscriptionClaims,
      setSubscriptionClaims,
      clearSubscriptionClaims,
      disconnect,
      getCurrentClaims,
      isConnected,
      isConnecting,
      error,
    }),
    [
      isConnected,
      isConnecting,
      error,
      subscribe,
      unsubscribe,
      updateSubscriptionClaims,
      setSubscriptionClaims,
      clearSubscriptionClaims,
      disconnect,
      getCurrentClaims,
    ],
  );

  return <SSEContext.Provider value={value}>{children}</SSEContext.Provider>;
};

export const useSSE = (options: {
  eventTypes: EventType[];
  onMessage: (event: MessageEvent) => void;
}): UseSSEReturn => {
  const context = React.useContext(SSEContext);
  if (context === undefined) {
    throw new Error("useSSE must be used within SSEProvider");
  }

  const subscriptionIdRef = useRef<string | null>(null);

  useEffect(() => {
    subscriptionIdRef.current = context.subscribe(options.eventTypes, options.onMessage);
    return (): void => {
      if (subscriptionIdRef.current) {
        context.unsubscribe(subscriptionIdRef.current);
      }
    };
  }, [options.eventTypes, options.onMessage, context]);

  const updateClaims = useCallback(
    (claims: SSEClaims): void => {
      if (subscriptionIdRef.current) {
        context.updateSubscriptionClaims(subscriptionIdRef.current, claims);
      }
    },
    [context],
  );

  const setClaims = useCallback(
    (claims: SSEClaims): void => {
      if (subscriptionIdRef.current) {
        context.setSubscriptionClaims(subscriptionIdRef.current, claims);
      }
    },
    [context],
  );

  const clearClaims = useCallback((): void => {
    if (subscriptionIdRef.current) {
      context.clearSubscriptionClaims(subscriptionIdRef.current);
    }
  }, [context]);

  return {
    updateClaims,
    setClaims,
    clearClaims,
    disconnect: context.disconnect,
    currentClaims: context.getCurrentClaims(),
    isConnected: context.isConnected,
    isConnecting: context.isConnecting,
    error: context.error,
  };
};
