"use client";

import { chatActions } from "@/actions/bevor";
import { FindingSchemaI } from "@/utils/types";
import { QueryKey, useMutation, UseMutationResult, useQueryClient } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

export type ChatAttribute = { type: "node" | "finding"; id: string; name: string };

export type ChatType = "code" | "analysis";

interface ChatContextValue {
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  isExpanded: boolean;
  toggleExpanded: () => void;
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
  codeId: string | null;
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
  const [isExpanded, setIsExpanded] = useState(true); // for now, just default to open on page navigation.
  const [showSettings, setShowSettings] = useState(!initialChatId);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, [setIsExpanded]);

  const createChatMutation = useMutation({
    mutationFn: async () => {
      if (!codeId) throw new Error("Code version ID is required");
      return chatActions
        .initiateChat(teamSlug, {
          chat_type: chatType,
          code_version_id: codeId,
          ...(analysisNodeId && { analysis_node_id: analysisNodeId }),
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
        name: `finding ${finding.id.slice(-6)}`,
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
    codeId,
    analysisNodeId,
    teamSlug,
    projectSlug,
    showSettings,
    setShowSettings,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
