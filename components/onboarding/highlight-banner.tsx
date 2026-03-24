"use client";

import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/useOnboarding";
import { cn } from "@/lib/utils";
import { ArrowRight, LucideIcon, PlayCircle, Upload, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect } from "react";

interface BannerRowProps {
  icon: LucideIcon;
  iconClassName: string;
  borderClassName: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonHref: string;
  buttonVariant?: "default" | "outline";
  onDismiss: () => void;
  className?: string;
}

const BannerRow: React.FC<BannerRowProps> = ({
  icon: Icon,
  iconClassName,
  borderClassName,
  title,
  subtitle,
  buttonLabel,
  buttonHref,
  buttonVariant = "default",
  onDismiss,
  className,
}) => (
  <div
    className={cn(
      "flex items-center justify-between gap-4 rounded-lg border bg-black px-4 py-3",
      borderClassName,
      className,
    )}
  >
    <div className="flex items-center gap-3 min-w-0">
      <Icon className={cn("size-4 shrink-0", iconClassName)} />
      <p className="text-sm text-foreground truncate">
        {title} <span className="text-muted-foreground">{subtitle}</span>
      </p>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <Button asChild size="sm" variant={buttonVariant} className="h-7 text-xs gap-1.5">
        <Link href={buttonHref}>
          {buttonLabel}
          <ArrowRight className="size-3" />
        </Link>
      </Button>
      <button
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="size-4" />
      </button>
    </div>
  </div>
);

interface HighlightBannerProps {
  hasCode: boolean;
  hasAnalysis: boolean;
  uploadHref: string;
  analyzeHref?: string;
  className?: string;
}

export const HighlightBanner: React.FC<HighlightBannerProps> = ({
  hasCode,
  hasAnalysis,
  uploadHref,
  analyzeHref,
  className,
}) => {
  const { pageViews, bannerDismissed, incrementPageViews, dismissBanner, hydrated } =
    useOnboarding();

  useEffect(() => {
    if (hydrated) {
      incrementPageViews();
    }
    // Only increment once on mount after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  if (!hydrated || bannerDismissed) return null;

  if (!hasCode && pageViews >= 2) {
    return (
      <BannerRow
        icon={Upload}
        iconClassName="text-blue-400"
        borderClassName="border-blue-500/30"
        title="Ready to get started?"
        subtitle="Upload your first smart contract."
        buttonLabel="Upload Code"
        buttonHref={uploadHref}
        onDismiss={dismissBanner}
        className={className}
      />
    );
  }

  if (hasCode && !hasAnalysis && analyzeHref) {
    return (
      <BannerRow
        icon={PlayCircle}
        iconClassName="text-green-400"
        borderClassName="border-green-500/30"
        title="Your code is ready."
        subtitle="Run an analysis to surface security findings."
        buttonLabel="Start Analysis"
        buttonHref={analyzeHref}
        buttonVariant="outline"
        onDismiss={dismissBanner}
        className={className}
      />
    );
  }

  return null;
};
