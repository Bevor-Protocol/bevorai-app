"use client";

import { useCallback, useEffect, useState } from "react";

export type OnboardingPersona =
  | "solo-dev"
  | "dev-team"
  | "auditing-firm"
  | "solo-auditor"
  | "agent-builder";

export const ONBOARDING_ITEMS = {
  UPLOAD_CODE: "upload-code",
  RUN_ANALYSIS: "run-analysis",
  INVITE_TEAMMATE: "invite-teammate",
  CREATE_API_KEY: "create-api-key",
} as const;

export type OnboardingItemId = (typeof ONBOARDING_ITEMS)[keyof typeof ONBOARDING_ITEMS];

export interface OnboardingState {
  persona: OnboardingPersona | null;
  dismissed: boolean;
  completedItems: OnboardingItemId[];
  pageViews: number;
  bannerDismissed: boolean;
}

const STORAGE_KEY = "bevor_onboarding";

const DEFAULT_STATE: OnboardingState = {
  persona: null,
  dismissed: false,
  completedItems: [],
  pageViews: 0,
  bannerDismissed: false,
};

function readState(): OnboardingState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeState(state: OnboardingState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

  const setPersona = useCallback((persona: OnboardingPersona) => {
    setState((prev) => {
      const next = { ...prev, persona };
      writeState(next);
      return next;
    });
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
    setPersona,
    dismiss,
    dismissBanner,
    completeItem,
    incrementPageViews,
    reset,
  };
}

export function getChecklistItems(persona: OnboardingPersona | null): {
  id: OnboardingItemId;
  label: string;
  description: string;
}[] {
  const base = [
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
  ] as const;

  switch (persona) {
    case "dev-team":
    case "auditing-firm":
      return [
        ...base,
        {
          id: ONBOARDING_ITEMS.INVITE_TEAMMATE,
          label: "Invite a teammate",
          description: "Collaborate on audits with your team",
        },
      ];
    case "agent-builder":
      return [
        {
          id: ONBOARDING_ITEMS.CREATE_API_KEY,
          label: "Create an API key",
          description: "Get programmatic access to BevorAI analysis",
        },
        ...base,
      ];
    default:
      return [...base];
  }
}
