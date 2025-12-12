import { authActions, tokenActions } from "@/actions/bevor";
import { useCallback, useEffect, useRef, useState } from "react";

type EventType = "activities" | "code_versions" | "invites" | "teams";

export interface UseSSEOptions {
  url?: string;
  onMessage?: (message: MessageEvent) => void;
  onError?: (error: Event | Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
  autoConnect?: boolean;
  eventTypes?: EventType[];
  method?: "GET" | "POST";
  body?: BodyInit;
  headers?: Record<string, string>;
}

export interface UseSSEReturn {
  connect: (url?: string) => void;
  disconnect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  error: Event | Error | null;
}

export const useSSE = (options: UseSSEOptions = {}): UseSSEReturn => {
  const {
    url: defaultUrl = "",
    onMessage,
    onError,
    onOpen,
    onClose,
    autoConnect = true,
    eventTypes = [],
    method = "GET",
    body,
  } = options;
  const [baseUrl, setBaseUrl] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Event | Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const eventListenersRef = useRef<Map<string, (event: MessageEvent) => void>>(new Map());
  const callbacksRef = useRef({ onMessage, onError, onOpen, onClose });

  useEffect(() => {
    authActions.getBaseUrl().then((url) => setBaseUrl(url + "/events"));
  }, []);

  useEffect(() => {
    callbacksRef.current = { onMessage, onError, onOpen, onClose };
  }, [onMessage, onError, onOpen, onClose]);

  const connectRef = useRef<((url?: string) => void) | null>(null);
  const disconnectRef = useRef<(() => void) | null>(null);

  const connect = useCallback(
    async (url?: string): Promise<void> => {
      if (!baseUrl) return;

      const targetUrl = url ?? defaultUrl ?? "";
      const useEventSource = method === "GET" && !body;

      if (useEventSource && eventSourceRef.current) return;
      if (!useEventSource && abortControllerRef.current) return;

      setIsConnecting(true);
      setError(null);

      const token = await tokenActions.issueSSEToken();

      const fullURL = `${baseUrl}${targetUrl}?token=${token}`;

      const eventSource = new EventSource(fullURL, {
        withCredentials: true,
      });
      eventSourceRef.current = eventSource;

      eventSource.onopen = (): void => {
        setIsConnected(true);
        setIsConnecting(false);
        callbacksRef.current.onOpen?.();
      };

      eventSource.onerror = (err): void => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        setIsConnected(false);
        setIsConnecting(false);
        callbacksRef.current.onError?.(err);
        callbacksRef.current.onClose?.();
        return;
      };

      const handleMessage = (event: MessageEvent): void => {
        callbacksRef.current.onMessage?.(event);
        let parsed;
        try {
          parsed = JSON.parse(event.data);
        } catch {
          parsed = event.data;
        }

        if (parsed === "done") {
          eventSourceRef.current?.close();
          eventSourceRef.current = null;
          setIsConnected(false);
          setIsConnecting(false);
          callbacksRef.current.onClose?.();
        }
      };

      eventSource.onmessage = handleMessage;

      eventTypes.forEach((eventType) => {
        const listener = (event: MessageEvent): void => {
          callbacksRef.current.onMessage?.(event);
        };
        eventSource.addEventListener(eventType, listener);
        eventListenersRef.current.set(eventType, listener);
      });
    },
    [method, body, eventTypes, defaultUrl, baseUrl],
  );

  const disconnect = useCallback((): void => {
    if (eventSourceRef.current) {
      eventListenersRef.current.forEach((listener, eventType) => {
        eventSourceRef.current?.removeEventListener(eventType, listener);
      });
      eventListenersRef.current.clear();
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
      callbacksRef.current.onClose?.();
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsConnected(false);
      setIsConnecting(false);
      callbacksRef.current.onClose?.();
    }
  }, []);

  connectRef.current = connect;
  disconnectRef.current = disconnect;

  useEffect(() => {
    if (!baseUrl) return;
    if (autoConnect) {
      connectRef.current?.();
    }

    return (): void => {
      disconnectRef.current?.();
    };
  }, [autoConnect, baseUrl]);

  return {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    error,
  };
};
