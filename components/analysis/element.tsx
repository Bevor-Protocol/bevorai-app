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
import { formatDate } from "@/utils/helpers";
import { AnalysisNodeSchemaI } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  GitBranch,
  Lock,
  MessageSquare,
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

const getStatusIndicator = (
  status: string,
): { text: string; circleColor: string; textColor: string } => {
  switch (status) {
    case "success":
      return { text: "Success", circleColor: "bg-green-500", textColor: "text-green-500" };
    case "failed":
      return { text: "Failed", circleColor: "bg-red-500", textColor: "text-red-500" };
    case "processing":
      return { text: "Processing", circleColor: "bg-blue-500", textColor: "text-blue-500" };
    case "waiting":
      return { text: "Waiting", circleColor: "bg-yellow-500", textColor: "text-yellow-500" };
    case "partial":
      return { text: "Partial", circleColor: "bg-orange-500", textColor: "text-orange-500" };
    default:
      return { text: "Unknown", circleColor: "bg-muted", textColor: "text-muted-foreground" };
  }
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
      return <MessageSquare className="size-3" />;
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
  const shortId = analysisVersion.id.slice(0, 8);
  const status = "unknown"; // TODO: come back to this, if i want it.
  const statusIndicator = getStatusIndicator(status);
  const isRoot = !analysisVersion.parent_node_id;
  const isLeaf = analysisVersion.is_leaf;

  return (
    <div
      className={cn(
        "grid grid-cols-[24px_minmax(0,120px)_auto_minmax(100px,1fr)_auto] items-center gap-4 py-3 px-4 border rounded-lg group-hover:border-foreground/30 transition-colors",
        isRoot && "border-r-4 border-r-blue-500",
        isLeaf && "border-r-4 border-r-green-500",
        className,
      )}
      {...props}
    >
      <div className="flex justify-center">
        <Shield className="size-4 text-purple-400" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm font-mono truncate">{shortId}</p>
          {isRoot && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 whitespace-nowrap">
              ROOT
            </span>
          )}
          {isLeaf && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 whitespace-nowrap">
              LEAF
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col shrink-0 justify-center">
        <div className="flex items-center gap-2">
          <div className={cn("size-2 rounded-full shrink-0", statusIndicator.circleColor)} />
          <span className={cn("text-xs", statusIndicator.textColor)}>{statusIndicator.text}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground min-w-0">
        <div className="flex items-center gap-1 shrink-0">
          {getTriggerIcon(analysisVersion.trigger)}
          <span className="whitespace-nowrap">{getTriggerLabel(analysisVersion.trigger)}</span>
        </div>
        <span>•</span>
        <span className="whitespace-nowrap">
          {analysisVersion.n_scopes} scope
          {analysisVersion.n_scopes !== 1 ? "s" : ""}
        </span>
        <span>•</span>
        <span className="whitespace-nowrap">
          {analysisVersion.n_findings} finding
          {analysisVersion.n_findings !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap shrink-0">
        <Clock className="size-3" />
        <span>{formatDate(analysisVersion.created_at)}</span>
      </div>
    </div>
  );
};

export const AnalysisVersionElement: React.FC<{
  analysisVersion: AnalysisNodeSchemaI;
  isDisabled?: boolean;
}> = ({ analysisVersion, isDisabled = false }) => {
  return (
    <Link
      href={`/${analysisVersion.team_slug}/${analysisVersion.project_slug}/analyses/${analysisVersion.id}`}
      aria-disabled={isDisabled}
      className={cn("block group", isDisabled ? "cursor-default opacity-50" : "cursor-pointer")}
    >
      <AnalysisVersionElementBare analysisVersion={analysisVersion} />
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
