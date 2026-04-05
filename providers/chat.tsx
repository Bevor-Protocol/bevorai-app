"use client";

import { analysisActions, chatActions } from "@/actions/bevor";
import { persistChatPanelCookie, type ChatPanelCookieState } from "@/lib/chat-panel-cookie";
import { DraftFindingSchema, FindingSchema } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { truncateId } from "@/utils/helpers";
import {
  QueryKey,
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

export type ChatAttribute = { type: "node" | "finding"; id: string; name: string };

interface ChatContextValue {
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  isExpanded: boolean;
  toggleExpanded: () => void;
  isMaximized: boolean;
  toggleMaximized: () => void;
  selectedChatId?: string;
  setSelectedChatId: (chatId: string | undefined) => void;
  attributes: ChatAttribute[];
  addAttribute: (attribute: ChatAttribute) => void;
  removeAttribute: (type: "node" | "finding", id: string) => void;
  clearAttributes: () => void;
  addFinding: (finding: FindingSchema) => void;
  removeFinding: (findingId: string) => void;
  clearFindings: () => void;
  createChatMutation: UseMutationResult<
    {
      id: string;
      toInvalidate: QueryKey[];
    },
    Error,
    void,
    unknown
  >;
  analysisId: string;
  teamSlug: string;
  projectSlug: string;
  findings?: DraftFindingSchema[];
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export const useOptionalChat = (): ChatContextValue | undefined => {
  return useContext(ChatContext);
};

interface ChatProviderProps {
  children: React.ReactNode;
  teamSlug: string;
  projectSlug: string;
  analysisId: string;
  initialChatId?: string;
  /** Initial expanded state (pass server-resolved value from `cookies()` + `getChatPanelStateFromCookie`). */
  open: boolean;
  /** Initial maximized state from the same cookie read. */
  maximized?: boolean;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  teamSlug,
  projectSlug,
  analysisId,
  initialChatId,
  open,
  maximized = false,
}) => {
  const queryClient = useQueryClient();
  const [panel, setPanel] = useState<ChatPanelCookieState>(() => ({
    isExpanded: open,
    isMaximized: maximized,
  }));

  const setPanelPrefs = useCallback(
    (value: ChatPanelCookieState | ((prev: ChatPanelCookieState) => ChatPanelCookieState)) => {
      setPanel((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        persistChatPanelCookie(next);
        return next;
      });
    },
    [],
  );

  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(initialChatId);
  const [attributes, setAttributes] = useState<ChatAttribute[]>([]);
  const [showSettings, setShowSettings] = useState(!initialChatId);

  const draftQuery = useQuery({
    queryKey: generateQueryKey.analysisFindings(analysisId),
    queryFn: () =>
      analysisActions.getAnalysisFindings(teamSlug, analysisId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const toggleExpanded = useCallback(() => {
    setPanelPrefs((prev) => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, [setPanelPrefs]);

  const toggleMaximized = useCallback(() => {
    setPanelPrefs((prev) => ({ ...prev, isMaximized: !prev.isMaximized }));
  }, [setPanelPrefs]);

  const createChatMutation = useMutation({
    mutationFn: async () => {
      return chatActions
        .initiateAnalysisChat(teamSlug, {
          analysis_id: analysisId,
        })
        .then((r) => {
          if (!r.ok) throw r;
          return r.data;
        });
    },
    onSuccess: ({ id, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setSelectedChatId(id);
      setPanelPrefs((prev) => ({ isExpanded: true, isMaximized: prev.isMaximized }));
      setShowSettings(false);
    },
    onError: (err) => {
      console.log(err);
      toast.error("Failed to create chat");
    },
  });

  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      if (e.key === "l" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPanelPrefs((prev) => ({ ...prev, isExpanded: !prev.isExpanded }));
      }
    };
    document.addEventListener("keydown", down);
    return (): void => document.removeEventListener("keydown", down);
  }, [setPanelPrefs]);

  const addAttribute = useCallback((attribute: ChatAttribute) => {
    setAttributes((prev) => {
      const exists = prev.some((attr) => attr.type === attribute.type && attr.id === attribute.id);
      if (exists) return prev;
      return [...prev, attribute];
    });
  }, []);

  const removeAttribute = useCallback((type: "node" | "finding", id: string) => {
    setAttributes((prev) => prev.filter((attr) => !(attr.type === type && attr.id === id)));
  }, []);

  const clearAttributes = useCallback(() => {
    setAttributes([]);
  }, []);

  const addFinding = useCallback(
    (finding: FindingSchema) => {
      addAttribute({
        type: "finding",
        id: finding.id,
        name: `finding ${truncateId(finding.id)}`,
      });
    },
    [addAttribute],
  );

  const removeFinding = useCallback(
    (findingId: string) => {
      removeAttribute("finding", findingId);
    },
    [removeAttribute],
  );

  const clearFindings = useCallback(() => {
    setAttributes((prev) => prev.filter((attr) => attr.type !== "finding"));
  }, []);

  const value: ChatContextValue = {
    isExpanded: panel.isExpanded,
    toggleExpanded,
    isMaximized: panel.isMaximized,
    toggleMaximized,
    selectedChatId,
    setSelectedChatId,
    attributes,
    addAttribute,
    removeAttribute,
    clearAttributes,
    addFinding,
    removeFinding,
    clearFindings,
    createChatMutation,
    analysisId,
    teamSlug,
    projectSlug,
    showSettings,
    setShowSettings,
    findings: draftQuery.data,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
