import React from "react";

type localStorageKeys = "bevor:starred";

export interface StarredItem {
  id: string;
  type: "project" | "audit" | "version" | "chat";
  teamSlug: string;
  label: string;
  url: string;
}

type LocalStorageData = {
  "bevor:starred": StarredItem[];
};

const useLocalStorage = (): {
  getItem: <K extends localStorageKeys>(key: K) => LocalStorageData[K] | null;
  setItem: <K extends localStorageKeys>(key: K, value: LocalStorageData[K]) => void;
  addItem: <K extends localStorageKeys>(key: K, value: LocalStorageData[K]) => void;
  removeItem: (key: localStorageKeys, value: string) => void;
  clearItem: (key: localStorageKeys) => void;
} => {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const getItem = React.useCallback(
    <K extends localStorageKeys>(key: K): LocalStorageData[K] | null => {
      if (!isClient) return null;

      try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        return JSON.parse(item) as LocalStorageData[K];
      } catch {
        return null;
      }
    },
    [isClient],
  );

  const setItem = React.useCallback(
    <K extends localStorageKeys>(key: K, value: LocalStorageData[K]): void => {
      if (!isClient) return;
      localStorage.setItem(key, JSON.stringify(value));
    },
    [isClient],
  );

  const addItem = React.useCallback(
    <K extends localStorageKeys>(key: K, value: LocalStorageData[K]): void => {
      if (!isClient) return;

      const curItem = getItem(key);
      if (curItem) {
        const newItem = [...curItem, ...value];
        setItem(key, newItem as LocalStorageData[K]);
      }
    },
    [isClient, getItem, setItem],
  );

  const removeItem = React.useCallback(
    <K extends localStorageKeys>(key: K, value: string): void => {
      if (!isClient) return;

      const curItem = getItem(key);
      if (curItem) {
        const newItem = curItem.filter((item) => item.id != value);
        setItem(key, newItem as LocalStorageData[K]);
      }
    },
    [isClient, getItem, setItem],
  );

  const clearItem = React.useCallback(
    (key: localStorageKeys): void => {
      if (!isClient) return;
      localStorage.removeItem(key);
    },
    [isClient],
  );

  return {
    getItem,
    setItem,
    addItem,
    removeItem,
    clearItem,
  };
};

export default useLocalStorage;
