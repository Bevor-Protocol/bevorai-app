"use client";

import { analysisActions, chatActions } from "@/actions/bevor";
import { generateQueryKey } from "@/utils/constants";
import { truncateId } from "@/utils/helpers";
import { DraftSchemaI, FindingSchemaI } from "@/utils/types";
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

export type ChatType = "code" | "analysis";

interface ChatContextValue {
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  isExpanded: boolean;
  toggleExpanded: () => void;
  isMaximized: boolean;
  toggleMaximized: () => void;
  selectedChatId: string | null;
  setSelectedChatId: (chatId: string | null) => void;
  attributes: ChatAttribute[];
  addAttribute: (attribute: ChatAttribute) => void;
  removeAttribute: (type: "node" | "finding", id: string) => void;
  clearAttributes: () => void;
  addFinding: (finding: FindingSchemaI) => void;
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
  chatType: ChatType;
  codeId: string | null;
  analysisNodeId: string | null;
  teamSlug: string;
  projectSlug: string;
  draft?: DraftSchemaI;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

interface ChatProviderProps {
  children: React.ReactNode;
  teamSlug: string;
  projectSlug: string;
  chatType: ChatType;
  codeId?: string | null;
  analysisNodeId?: string | null;
  initialChatId: string | null;
  keyboardShortcut?: boolean;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  teamSlug,
  projectSlug,
  chatType,
  codeId,
  initialChatId,
  analysisNodeId = null,
}) => {
  const queryClient = useQueryClient();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId);
  const [attributes, setAttributes] = useState<ChatAttribute[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showSettings, setShowSettings] = useState(!initialChatId);

  const draftQuery = useQuery({
    queryKey: generateQueryKey.analysisDraft(analysisNodeId ?? ""),
    queryFn: () =>
      analysisActions.getDraft(teamSlug, analysisNodeId!).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: chatType === "analysis" && !!analysisNodeId,
    refetchInterval: 5000,
  });

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const toggleMaximized = useCallback(() => {
    setIsMaximized((prev) => !prev);
  }, []);

  const createChatMutation = useMutation({
    mutationFn: async () => {
      if (chatType === "analysis") {
        if (!analysisNodeId) throw new Error("analysisNodeId is required");
        return chatActions
          .initiateAnalysisChat(teamSlug, {
            analysis_node_id: analysisNodeId,
          })
          .then((r) => {
            if (!r.ok) throw r;
            return r.data;
          });
      } else if (chatType === "code") {
        if (!codeId) throw new Error("codeId is required");
        return chatActions.initiateCodeChat(teamSlug, { code_version_id: codeId }).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        });
      } else {
        throw new Error("invalid chatType");
      }
    },
    onSuccess: ({ id, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setSelectedChatId(id);
      setIsExpanded(true);
      setShowSettings(false);
    },
    onError: () => {
      toast.error("Failed to create chat");
    },
  });

  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      if (e.key === "l" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsExpanded((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return (): void => document.removeEventListener("keydown", down);
  }, []);

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
    (finding: FindingSchemaI) => {
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
    isExpanded,
    toggleExpanded,
    isMaximized,
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
    chatType,
    codeId: codeId ?? null,
    analysisNodeId,
    teamSlug,
    projectSlug,
    showSettings,
    setShowSettings,
    draft: draftQuery.data,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
