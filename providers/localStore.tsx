"use client";

import { ItemType } from "@/types";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

type localStorageKeys = "bevor:starred" | "bevor:chat-panel";

const CHAT_PANEL_SYNC_EVENT = "bevor:chat-panel:sync";

export interface StarredItem {
  id: string;
  type: ItemType;
  teamSlug: string;
  label: string;
  url: string;
}

export interface ChatPanelPreferences {
  isExpanded: boolean;
  isMaximized: boolean;
}

/** Legacy `bevor:chat-panel` stored a single boolean (expanded). */
export const normalizeChatPanelPrefs = (raw: unknown): ChatPanelPreferences | null => {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "boolean") {
    return { isExpanded: raw, isMaximized: false };
  }
  if (typeof raw === "object" && raw !== null && "isExpanded" in raw) {
    const o = raw as Record<string, unknown>;
    return {
      isExpanded: Boolean(o.isExpanded),
      isMaximized: Boolean(o.isMaximized),
    };
  }
  return null;
};

/** Frozen snapshots so useSyncExternalStore's getSnapshot stays referentially stable. */
const CHAT_PANEL_SNAPSHOTS: Record<string, ChatPanelPreferences> = {
  "true,false": Object.freeze({ isExpanded: true, isMaximized: false }),
  "true,true": Object.freeze({ isExpanded: true, isMaximized: true }),
  "false,false": Object.freeze({ isExpanded: false, isMaximized: false }),
  "false,true": Object.freeze({ isExpanded: false, isMaximized: true }),
};

const freezeChatPanelPrefs = (p: ChatPanelPreferences): ChatPanelPreferences => {
  return CHAT_PANEL_SNAPSHOTS[`${p.isExpanded},${p.isMaximized}`] ?? { ...p };
};

/**
 * SSR snapshot must share the same reference as the client's "closed" state so hydration
 * matches when the panel is saved closed, and getServerSnapshot must never allocate.
 */
const CHAT_PANEL_SERVER_SNAPSHOT = CHAT_PANEL_SNAPSHOTS["false,false"];

let chatPanelSnapshotCache: { storageSig: string; snapshot: ChatPanelPreferences } | null = null;

/** Client-only: read prefs from localStorage (missing key → product default: expanded). */
const getChatPanelSnapshot = (): ChatPanelPreferences => {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem("bevor:chat-panel");
  } catch {
    raw = null;
  }

  const storageSig = raw === null ? "\0__missing__" : raw;

  if (chatPanelSnapshotCache?.storageSig === storageSig) {
    return chatPanelSnapshotCache.snapshot;
  }

  let prefs: ChatPanelPreferences;
  if (!raw) {
    prefs = CHAT_PANEL_SNAPSHOTS["true,false"];
  } else {
    try {
      const normalized = normalizeChatPanelPrefs(JSON.parse(raw));
      prefs = normalized ? freezeChatPanelPrefs(normalized) : CHAT_PANEL_SNAPSHOTS["true,false"];
    } catch {
      prefs = CHAT_PANEL_SNAPSHOTS["true,false"];
    }
  }

  chatPanelSnapshotCache = { storageSig, snapshot: prefs };
  return prefs;
};

const getChatPanelServerSnapshot = (): ChatPanelPreferences => CHAT_PANEL_SERVER_SNAPSHOT;

const subscribeChatPanel = (onStoreChange: () => void): (() => void) => {
  const handler = (): void => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(CHAT_PANEL_SYNC_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(CHAT_PANEL_SYNC_EVENT, handler);
  };
};

export const writeChatPanelPreferences = (value: ChatPanelPreferences): void => {
  window.localStorage.setItem("bevor:chat-panel", JSON.stringify(value));
  window.dispatchEvent(new Event(CHAT_PANEL_SYNC_EVENT));
};

/** Synchronous client read + SSR-safe server snapshot; avoids flash when panel is saved closed. */
export const useChatPanelPreferences = (): {
  prefs: ChatPanelPreferences;
  setPrefs: (value: ChatPanelPreferences) => void;
} => {
  const prefs = useSyncExternalStore(
    subscribeChatPanel,
    getChatPanelSnapshot,
    getChatPanelServerSnapshot,
  );

  const setPrefs = useCallback((value: ChatPanelPreferences): void => {
    writeChatPanelPreferences(value);
  }, []);

  return { prefs, setPrefs };
};

type LocalStorageData = {
  "bevor:starred": StarredItem[];
  "bevor:chat-panel": ChatPanelPreferences;
};

type ArrayKeys = {
  [K in localStorageKeys]: LocalStorageData[K] extends readonly unknown[] ? K : never;
}[localStorageKeys];

interface LocalStorageContextType {
  getItems: <K extends localStorageKeys>(key: K) => LocalStorageData[K] | null;
  getItem: <K extends ArrayKeys>(key: K, id: string) => LocalStorageData[K][number] | undefined;
  setItem: <K extends localStorageKeys>(key: K, value: LocalStorageData[K]) => void;
  addItem: <K extends ArrayKeys>(key: K, value: LocalStorageData[K][number]) => void;
  removeItem: <K extends ArrayKeys>(key: K, value: string) => void;
  clearItem: (key: localStorageKeys) => void;
  getState: <K extends localStorageKeys>(key: K) => LocalStorageData[K] | null;
}

const LocalStorageContext = createContext<LocalStorageContextType | undefined>(undefined);

export const useLocalStorage = (): LocalStorageContextType => {
  const context = useContext(LocalStorageContext);
  if (!context) {
    throw new Error("useLocalStorage must be used within a LocalStorageProvider");
  }
  return context;
};

type IsArray<T> = T extends readonly unknown[] ? T : never;
type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

type UseLocalStorageStateReturn<K extends localStorageKeys> = {
  state: LocalStorageData[K] | null;
  setState: (value: LocalStorageData[K]) => void;
  clearItem: () => void;
} & (IsArray<LocalStorageData[K]> extends never
  ? Record<string, never>
  : {
      addItem: (value: ArrayElement<LocalStorageData[K]>) => void;
      removeItem: (id: string) => void;
    });

// Convenience hook for subscribing to a specific localStorage key
export const useLocalStorageState = <K extends localStorageKeys>(
  key: K,
): UseLocalStorageStateReturn<K> => {
  const { getState, setItem, addItem, removeItem, clearItem } = useLocalStorage();

  const state = getState(key);
  const isArrayType = Array.isArray(state);

  const baseReturn = {
    state,
    setState: (value: LocalStorageData[K]): void => setItem(key, value),
    clearItem: (): void => clearItem(key),
  };

  if (isArrayType) {
    return {
      ...baseReturn,
      addItem: (value: ArrayElement<LocalStorageData[K]>): void => {
        addItem(key as ArrayKeys, value);
      },
      removeItem: (id: string): void => {
        removeItem(key as ArrayKeys, id);
      },
    } as unknown as UseLocalStorageStateReturn<K>;
  }

  return baseReturn as unknown as UseLocalStorageStateReturn<K>;
};

interface LocalStorageProviderProps {
  children: React.ReactNode;
}

export const LocalStorageProvider: React.FC<LocalStorageProviderProps> = ({ children }) => {
  const [isClient, setIsClient] = useState(false);
  const [storageVersion, setStorageVersion] = useState(0);
  const [stateCache, setStateCache] = useState<Partial<LocalStorageData>>({});

  useEffect(() => {
    setIsClient(true);
  }, []);

  const refreshStorage = React.useCallback(() => {
    setStorageVersion((prev) => prev + 1);
  }, []);

  const getItems = React.useCallback(
    <K extends localStorageKeys>(key: K): LocalStorageData[K] | null => {
      if (!isClient) return null;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = storageVersion;

      try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        const parsed = JSON.parse(item) as unknown;
        if (key === "bevor:chat-panel") {
          return (normalizeChatPanelPrefs(parsed) ?? null) as LocalStorageData[K];
        }
        return parsed as LocalStorageData[K];
      } catch {
        return null;
      }
    },
    [isClient, storageVersion],
  );

  const getItem = React.useCallback(
    <K extends ArrayKeys>(key: K, id: string): LocalStorageData[K][number] | undefined => {
      if (!isClient) return;

      const curItem = getItems(key);
      if (!curItem || !Array.isArray(curItem)) {
        return undefined;
      }

      return curItem.find((item: { id: string }) => item.id === id);
    },
    [isClient, getItems],
  );

  const setItem = React.useCallback(
    <K extends localStorageKeys>(key: K, value: LocalStorageData[K]): void => {
      if (!isClient) return;
      localStorage.setItem(key, JSON.stringify(value));

      if (key === "bevor:chat-panel") {
        window.dispatchEvent(new Event(CHAT_PANEL_SYNC_EVENT));
      }

      // Update local state cache for reactive updates
      setStateCache((prev) => ({ ...prev, [key]: value }));

      refreshStorage();
    },
    [isClient, refreshStorage],
  );

  const addItem = React.useCallback(
    <K extends ArrayKeys>(key: K, value: LocalStorageData[K][number]): void => {
      if (!isClient) return;

      const curItem = getItems(key);
      if (curItem && Array.isArray(curItem)) {
        const newItem = [...curItem, value];
        setItem(key, newItem as LocalStorageData[K]);
      } else {
        setItem(key, [value] as LocalStorageData[K]);
      }
    },
    [isClient, getItems, setItem],
  );

  const removeItem = React.useCallback(
    <K extends ArrayKeys>(key: K, value: string): void => {
      if (!isClient) return;

      const curItem = getItems(key);
      if (curItem && Array.isArray(curItem)) {
        const newItem = curItem.filter((item: { id: string }) => item.id != value);
        setItem(key, newItem as LocalStorageData[K]);
      }
    },
    [isClient, getItems, setItem],
  );

  const clearItem = React.useCallback(
    (key: localStorageKeys): void => {
      if (!isClient) return;
      localStorage.removeItem(key);

      if (key === "bevor:chat-panel") {
        window.dispatchEvent(new Event(CHAT_PANEL_SYNC_EVENT));
      }

      // Update local state cache for reactive updates
      setStateCache((prev) => ({ ...prev, [key]: undefined }));

      refreshStorage();
    },
    [isClient, refreshStorage],
  );

  // Generic state getter that returns cached state or fetches from localStorage
  const getState = React.useCallback(
    <K extends localStorageKeys>(key: K): LocalStorageData[K] | null => {
      if (!isClient) return null;

      // Return cached state if available
      if (key in stateCache) {
        return stateCache[key] as LocalStorageData[K] | null;
      }

      // Fallback to localStorage
      return getItems(key);
    },
    [isClient, stateCache, getItems],
  );

  const contextValue: LocalStorageContextType = {
    getItems,
    getItem,
    setItem,
    addItem,
    removeItem,
    clearItem,
    getState,
  };

  return (
    <LocalStorageContext.Provider value={contextValue}>{children}</LocalStorageContext.Provider>
  );
};
