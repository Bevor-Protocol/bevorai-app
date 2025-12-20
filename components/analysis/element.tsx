"use client";

import { analysisActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate, truncateId } from "@/utils/helpers";
import { AnalysisNodeSchemaI } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BotMessageSquare,
  Clock,
  GitBranch,
  Lock,
  MoreHorizontal,
  Shield,
  Unlock,
  User,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";

export const AnalysisElementLoader: React.FC = () => {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="size-6 rounded-lg" />
            <div className="flex items-center space-x-3">
              <Skeleton className="w-24 h-4" />
              <div className="flex items-center space-x-1">
                <Skeleton className="w-3 h-3" />
                <Skeleton className="w-20 h-3" />
              </div>
            </div>
          </div>
          <Skeleton className="size-4" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-8 h-3" />
            <Skeleton className="w-8 h-3" />
            <Skeleton className="w-8 h-3" />
            <Skeleton className="w-8 h-3" />
          </div>
          <Skeleton className="w-24 h-3" />
        </div>
      </div>
    </div>
  );
};

export const AnalysisVersionElementCompact: React.FC<
  {
    analysisVersion: AnalysisNodeSchemaI;
  } & React.ComponentProps<"div">
> = ({ analysisVersion, className, ...props }) => {
  return (
    <div className={cn("flex items-center gap-2 py-2 px-3", className)} {...props}>
      <Shield className="size-3.5 text-purple-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm font-mono">
            v{analysisVersion.id.slice(0, 6)}...{analysisVersion.id.slice(-4)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>{analysisVersion.n_scopes} scopes</span>
          <span>•</span>
          <span>{analysisVersion.n_findings} findings</span>
        </div>
      </div>
    </div>
  );
};

const getTriggerLabel = (trigger: string): string => {
  switch (trigger) {
    case "manual_run":
      return "Manual Run";
    case "chat":
      return "Chat";
    case "manual_edit":
      return "Manual Edit";
    case "fork":
      return "Fork";
    case "merge":
      return "Merge";
    default:
      return trigger;
  }
};

const getTriggerIcon = (trigger: string): React.ReactElement => {
  switch (trigger) {
    case "chat":
      return <BotMessageSquare className="size-3" />;
    case "manual_run":
    case "manual_edit":
      return <User className="size-3" />;
    case "fork":
    case "merge":
      return <GitBranch className="size-3" />;
    default:
      return <Shield className="size-3" />;
  }
};

export const AnalysisVersionElementBare: React.FC<
  {
    analysisVersion: AnalysisNodeSchemaI;
    isPreview?: boolean;
  } & React.ComponentProps<"div">
> = ({ analysisVersion, className, ...props }) => {
  const isRoot = !analysisVersion.parent_node_id;
  const isLeaf = analysisVersion.is_leaf;

  return (
    <div
      className={cn(
        "grid grid-cols-[24px_1fr_2fr_1fr_1fr_1fr_100px] items-center gap-4 py-3 px-4 border rounded-lg group-hover:border-foreground/30 transition-colors",
        className,
      )}
      {...props}
    >
      <Shield className="size-4 text-purple-400 justify-self-center" />
      <div className="flex items-center gap-2 min-w-0">
        <p className={cn("font-medium text-sm font-mono", isRoot || isLeaf ? "" : "truncate")}>
          {truncateId(analysisVersion.id)}
        </p>
      </div>
      <div className="flex items-center gap-1 justify-start">
        {isRoot && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 whitespace-nowrap shrink-0">
            ROOT
          </span>
        )}
        {isLeaf && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 whitespace-nowrap shrink-0">
            LEAF
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap justify-center">
        {getTriggerIcon(analysisVersion.trigger)}
        {getTriggerLabel(analysisVersion.trigger)}
      </div>
      <div className="text-xs text-muted-foreground whitespace-nowrap justify-center">
        {analysisVersion.n_scopes} scope
        {analysisVersion.n_scopes !== 1 ? "s" : ""}
      </div>
      <div className="text-xs text-muted-foreground whitespace-nowrap justify-center">
        {analysisVersion.n_findings} finding
        {analysisVersion.n_findings !== 1 ? "s" : ""}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap justify-end">
        <Clock className="size-3" />
        <span>{formatDate(analysisVersion.created_at)}</span>
      </div>
    </div>
  );
};

export const AnalysisVersionElement: React.FC<
  {
    analysisVersion: AnalysisNodeSchemaI;
    isDisabled?: boolean;
    link?: string;
  } & React.ComponentProps<"div">
> = ({ analysisVersion, isDisabled = false, link, className, ...props }) => {
  return (
    <Link
      href={
        link ||
        `/team/${analysisVersion.team_slug}/${analysisVersion.project_slug}/analyses/${analysisVersion.id}`
      }
      aria-disabled={isDisabled}
      className={cn("block group", isDisabled ? "cursor-default opacity-50" : "cursor-pointer")}
    >
      <AnalysisVersionElementBare
        analysisVersion={analysisVersion}
        className={className}
        {...props}
      />
    </Link>
  );
};

export const AnalysisElementMenu: React.FC<{
  analysis: AnalysisNodeSchemaI;
  teamSlug: string;
}> = ({ analysis, teamSlug }) => {
  const queryClient = useQueryClient();

  const visibilityMutation = useMutation({
    mutationFn: async () => analysisActions.toggleVisibility(teamSlug, analysis.id),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Visibility updated");
    },
    onError: () => {
      toast.error("Failed to update visibility");
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <MoreHorizontal className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            visibilityMutation.mutate();
          }}
          disabled={visibilityMutation.isPending}
        >
          {analysis.is_public ? (
            <>
              <Lock className="size-4" />
              Make private
            </>
          ) : (
            <>
              <Unlock className="size-4" />
              Make public
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
