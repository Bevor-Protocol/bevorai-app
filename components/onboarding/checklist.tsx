"use client";

import { Button } from "@/components/ui/button";
import { getChecklistItems, ONBOARDING_ITEMS, useOnboarding } from "@/hooks/useOnboarding";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

interface OnboardingChecklistProps {
  teamSlug: string;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ teamSlug }) => {
  const { persona, dismissed, completedItems, hydrated, dismiss } = useOnboarding();
  const [collapsed, setCollapsed] = useState(false);

  if (!hydrated || dismissed) return null;

  const items = getChecklistItems(persona);
  const completedCount = items.filter((item) => completedItems.includes(item.id)).length;
  const allDone = completedCount === items.length;

  const getHref = (id: string): string => {
    switch (id) {
      case ONBOARDING_ITEMS.UPLOAD_CODE:
        return `/team/${teamSlug}`;
      case ONBOARDING_ITEMS.RUN_ANALYSIS:
        return `/team/${teamSlug}`;
      case ONBOARDING_ITEMS.INVITE_TEAMMATE:
        return `/team/${teamSlug}/settings/members`;
      case ONBOARDING_ITEMS.CREATE_API_KEY:
        return `/team/${teamSlug}/settings/api`;
      default:
        return `/team/${teamSlug}`;
    }
  };

  return (
    <div className="rounded-lg border bg-black overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Getting started</p>
            <span className="text-xs text-muted-foreground">
              {completedCount}/{items.length}
            </span>
          </div>
          <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(completedCount / items.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="size-7 p-0"
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </Button>
          <Button variant="ghost" size="sm" className="size-7 p-0" onClick={dismiss}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {!collapsed && (
        <div className="divide-y">
          {items.map((item) => {
            const done = completedItems.includes(item.id);
            if (done) {
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 px-4 py-3 opacity-50"
                >
                  <div className="mt-0.5 size-4 shrink-0 rounded-full border-2 border-primary bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="size-2.5 stroke-[3]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium line-through">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                </div>
              );
            }
            return (
              <Link
                key={item.id}
                href={getHref(item.id)}
                className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="mt-0.5 size-4 shrink-0 rounded-full border-2 border-muted-foreground flex items-center justify-center" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </Link>
            );
          })}

          {allDone && (
            <div className="px-4 py-3 text-center">
              <p className="text-sm text-muted-foreground">
                You&apos;re all set!{" "}
                <button
                  onClick={dismiss}
                  className="text-primary underline underline-offset-2 hover:no-underline"
                >
                  Dismiss
                </button>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
