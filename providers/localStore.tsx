"use client";

import { ItemType } from "@/utils/types";
import React, { createContext, useContext, useEffect, useState } from "react";

type localStorageKeys = "bevor:starred" | "bevor:chat-panel";

export interface StarredItem {
  id: string;
  type: ItemType;
  teamSlug: string;
  label: string;
  url: string;
}

type LocalStorageData = {
  "bevor:starred": StarredItem[];
  "bevor:chat-panel": boolean;
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
        return JSON.parse(item) as LocalStorageData[K];
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
