"use client";

import { ItemType } from "@/utils/types";
import React, { createContext, useContext, useEffect, useState } from "react";

type localStorageKeys = "bevor:starred";

export interface StarredItem {
  id: string;
  type: ItemType;
  teamSlug: string;
  label: string;
  url: string;
}

type LocalStorageData = {
  "bevor:starred": StarredItem[];
};

interface LocalStorageContextType {
  getItems: <K extends localStorageKeys>(key: K) => LocalStorageData[K] | null;
  getItem: <K extends localStorageKeys>(
    key: K,
    id: string,
  ) => LocalStorageData[K][number] | undefined;
  setItem: <K extends localStorageKeys>(key: K, value: LocalStorageData[K]) => void;
  addItem: <K extends localStorageKeys>(key: K, value: LocalStorageData[K][number]) => void;
  removeItem: (key: localStorageKeys, value: string) => void;
  clearItem: (key: localStorageKeys) => void;
  // Generic state getter for reactive updates
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

// Convenience hook for subscribing to a specific localStorage key
export const useLocalStorageState = <K extends localStorageKeys>(
  key: K,
): {
  state: LocalStorageData[K] | null;
  setState: (value: LocalStorageData[K]) => void;
  addItem: (value: LocalStorageData[K][number]) => void;
  removeItem: (id: string) => void;
  clearItem: () => void;
} => {
  const { getState, setItem, addItem, removeItem, clearItem } = useLocalStorage();

  return {
    state: getState(key),
    setState: (value: LocalStorageData[K]): void => setItem(key, value),
    addItem: (value: LocalStorageData[K][number]): void => addItem(key, value),
    removeItem: (id: string): void => removeItem(key, id),
    clearItem: (): void => clearItem(key),
  };
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
    <K extends localStorageKeys>(key: K, id: string): LocalStorageData[K][number] | undefined => {
      if (!isClient) return;

      const curItem = getItems(key);
      if (!curItem) return;
      if (!Array.isArray(curItem)) {
        return curItem;
      }

      return curItem?.find((item) => item.id === id);
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
    <K extends localStorageKeys>(key: K, value: LocalStorageData[K][number]): void => {
      if (!isClient) return;

      const curItem = getItems(key);
      if (curItem) {
        const newItem = [...curItem, value];
        setItem(key, newItem as LocalStorageData[K]);
      } else {
        setItem(key, [value]);
      }
    },
    [isClient, getItems, setItem],
  );

  const removeItem = React.useCallback(
    (key: localStorageKeys, value: string): void => {
      if (!isClient) return;

      const curItem = getItems(key);
      if (curItem) {
        const newItem = curItem.filter((item) => item.id != value);
        setItem(key, newItem as any);
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
