"use client";

import { useCallback, useEffect, useState } from "react";

export type OnboardingPersona =
  | "smart-contract-engineer"
  | "auditor"
  | "builder"
  | "bounty-hunter"
  | "devops"
  | "exec";

export const ONBOARDING_ITEMS = {
  UPLOAD_CODE: "upload-code",
  RUN_ANALYSIS: "run-analysis",
  INVITE_TEAMMATE: "invite-teammate",
  CREATE_API_KEY: "create-api-key",
  INSTALL_MCP: "install-mcp",
  INSTALL_SKILLS: "install-skills",
  ADD_CICD: "add-cicd",
  INSTALL_SDK: "install-sdk",
  RUN_CUSTOM_AGENT: "run-custom-agent",
  VALIDATE_VULNERABILITY: "validate-vulnerability",
} as const;

export type OnboardingItemId = (typeof ONBOARDING_ITEMS)[keyof typeof ONBOARDING_ITEMS];

// Persistent across sessions: tracks what the user has completed.
export interface OnboardingPersistentState {
  completedItems: OnboardingItemId[];
  pageViews: number;
}

// Session-only: resets when the browser closes / user logs back in.
export interface OnboardingSessionState {
  dismissed: boolean;
  bannerDismissed: boolean;
}

export interface OnboardingState extends OnboardingPersistentState, OnboardingSessionState {}

const PERSISTENT_KEY = "bevor_onboarding";
const SESSION_KEY = "bevor_onboarding_session";

const DEFAULT_PERSISTENT: OnboardingPersistentState = {
  completedItems: [],
  pageViews: 0,
};

const DEFAULT_SESSION: OnboardingSessionState = {
  dismissed: false,
  bannerDismissed: false,
};

const DEFAULT_STATE: OnboardingState = { ...DEFAULT_PERSISTENT, ...DEFAULT_SESSION };

function readState(): OnboardingState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const persistent = localStorage.getItem(PERSISTENT_KEY);
    const session = sessionStorage.getItem(SESSION_KEY);
    return {
      ...DEFAULT_PERSISTENT,
      ...(persistent ? JSON.parse(persistent) : {}),
      ...DEFAULT_SESSION,
      ...(session ? JSON.parse(session) : {}),
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeState(state: OnboardingState): void {
  if (typeof window === "undefined") return;
  try {
    const { completedItems, pageViews } = state;
    localStorage.setItem(PERSISTENT_KEY, JSON.stringify({ completedItems, pageViews }));
    const { dismissed, bannerDismissed } = state;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ dismissed, bannerDismissed }));
  } catch {
    // ignore
  }
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readState();
    setState(stored);
    setHydrated(true);
  }, []);

  const dismiss = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, dismissed: true };
      writeState(next);
      return next;
    });
  }, []);

  const dismissBanner = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, bannerDismissed: true };
      writeState(next);
      return next;
    });
  }, []);

  const completeItem = useCallback((item: OnboardingItemId) => {
    setState((prev) => {
      if (prev.completedItems.includes(item)) return prev;
      const next = { ...prev, completedItems: [...prev.completedItems, item] };
      writeState(next);
      return next;
    });
  }, []);

  const incrementPageViews = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, pageViews: prev.pageViews + 1 };
      writeState(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
    writeState(DEFAULT_STATE);
  }, []);

  return {
    ...state,
    hydrated,
    dismiss,
    dismissBanner,
    completeItem,
    incrementPageViews,
    reset,
  };
}

export interface ChecklistItem {
  id: OnboardingItemId;
  label: string;
  description: string;
}

export function getChecklistItems(persona: OnboardingPersona | null): ChecklistItem[] {
  switch (persona) {
    case "smart-contract-engineer":
      return [
        {
          id: ONBOARDING_ITEMS.UPLOAD_CODE,
          label: "Upload codebase",
          description: "Upload Solidity files, scan a deployed address, or connect a repository",
        },
        {
          id: ONBOARDING_ITEMS.INSTALL_MCP,
          label: "Install Bevor MCP",
          description: "Add BevorAI as an MCP server in your AI coding environment",
        },
        {
          id: ONBOARDING_ITEMS.INSTALL_SKILLS,
          label: "Install Skills",
          description: "Install BevorAI Cursor skills for AI-assisted security workflows",
        },
        {
          id: ONBOARDING_ITEMS.ADD_CICD,
          label: "Add Bevor to CI/CD pipeline",
          description: "Automate security analysis on every push via the API",
        },
        {
          id: ONBOARDING_ITEMS.VALIDATE_VULNERABILITY,
          label: "Validate first vulnerability",
          description: "Confirm or dismiss a security finding from your first analysis",
        },
      ];

    case "auditor":
      return [
        {
          id: ONBOARDING_ITEMS.UPLOAD_CODE,
          label: "Upload codebase",
          description: "Upload the client's Solidity files or connect their repository",
        },
        {
          id: ONBOARDING_ITEMS.RUN_ANALYSIS,
          label: "Ramp-up on client codebase scope",
          description: "Run an AI analysis to surface security findings across the contract",
        },
        {
          id: ONBOARDING_ITEMS.VALIDATE_VULNERABILITY,
          label: "Validate first vulnerability",
          description: "Confirm or dismiss a security finding in your audit",
        },
        {
          id: ONBOARDING_ITEMS.INSTALL_MCP,
          label: "Install Bevor MCP",
          description: "Add BevorAI as an MCP server in your AI coding environment",
        },
        {
          id: ONBOARDING_ITEMS.INSTALL_SKILLS,
          label: "Install Skills",
          description: "Install BevorAI Cursor skills for AI-assisted audit workflows",
        },
      ];

    case "builder":
      return [
        {
          id: ONBOARDING_ITEMS.CREATE_API_KEY,
          label: "Get API Key",
          description: "Generate an API key for programmatic access to BevorAI",
        },
        {
          id: ONBOARDING_ITEMS.INSTALL_SDK,
          label: "Install Bevor SDK",
          description: "Add the BevorAI SDK to your project to start making API calls",
        },
        {
          id: ONBOARDING_ITEMS.RUN_CUSTOM_AGENT,
          label: "Run custom agent/tool on codebase",
          description: "Execute your first custom agent or tool powered by BevorAI analysis",
        },
      ];

    case "bounty-hunter":
      return [
        {
          id: ONBOARDING_ITEMS.UPLOAD_CODE,
          label: "Upload codebase",
          description: "Upload the target contract files or scan a deployed address",
        },
        {
          id: ONBOARDING_ITEMS.RUN_ANALYSIS,
          label: "Ramp-up on bounty scope",
          description: "Run an AI analysis to map the attack surface across the contract",
        },
        {
          id: ONBOARDING_ITEMS.VALIDATE_VULNERABILITY,
          label: "Validate first vulnerability",
          description: "Confirm a security finding as a valid exploit path",
        },
        {
          id: ONBOARDING_ITEMS.INSTALL_MCP,
          label: "Install Bevor MCP",
          description: "Add BevorAI as an MCP server in your AI coding environment",
        },
        {
          id: ONBOARDING_ITEMS.INSTALL_SKILLS,
          label: "Install Skills",
          description: "Install BevorAI Cursor skills for AI-assisted bug hunting",
        },
      ];

    case "devops":
      return [
        {
          id: ONBOARDING_ITEMS.UPLOAD_CODE,
          label: "Upload codebase",
          description: "Upload Solidity files or connect your GitHub repository",
        },
        {
          id: ONBOARDING_ITEMS.CREATE_API_KEY,
          label: "Get API Key",
          description: "Generate an API key for CI/CD integration",
        },
        {
          id: ONBOARDING_ITEMS.ADD_CICD,
          label: "Add Bevor to CI/CD pipeline",
          description: "Automate security analysis on every push or pull request",
        },
      ];

    case "exec":
      return [
        {
          id: ONBOARDING_ITEMS.INVITE_TEAMMATE,
          label: "Add team members",
          description: "Invite your developers and auditors to the workspace",
        },
        {
          id: ONBOARDING_ITEMS.UPLOAD_CODE,
          label: "Upload code",
          description: "Upload a smart contract to start your first security analysis",
        },
        {
          id: ONBOARDING_ITEMS.RUN_ANALYSIS,
          label: "Onboard to codebase",
          description: "Run an analysis to get a security overview of your contracts",
        },
      ];

    default:
      return [
        {
          id: ONBOARDING_ITEMS.UPLOAD_CODE,
          label: "Upload your first smart contract",
          description: "Upload Solidity files, scan a deployed address, or connect a repository",
        },
        {
          id: ONBOARDING_ITEMS.RUN_ANALYSIS,
          label: "Run your first analysis",
          description: "Get AI-powered security findings for your contract code",
        },
      ];
  }
}
