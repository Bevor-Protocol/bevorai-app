"use client";

import { analysisActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { AnalysisNodeSchema } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { formatDateShort } from "@/utils/helpers";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  Copy,
  Globe,
  Info,
  Leaf,
  Lock,
  RefreshCw,
  TreeDeciduous,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import AnalysisVersionMenu from "./menu";

const getStatusIndicator = (status: AnalysisNodeSchema["status"]): React.ReactNode => {
  switch (status) {
    case "waiting":
      return (
        <div className="flex items-center gap-1">
          <div className="size-2 rounded-full bg-neutral-400 shrink-0 animate-pulse" />
          <span className="capitalize">Waiting</span>
        </div>
      );
    case "processing":
      return (
        <div className="flex items-center gap-1">
          <div className="size-3 rounded-full bg-blue-400 shrink-0 animate-pulse" />
          <span className="capitalize">Processing</span>
        </div>
      );
    case "failed":
      return (
        <div className="flex items-center gap-1">
          <XCircle className="size-3 text-destructive shrink-0" />
          <span className="capitalize">Failed</span>
        </div>
      );
    case "partial":
      return (
        <div className="flex items-center gap-1">
          <AlertCircle className="size-3 text-yellow-400 shrink-0" />
          <span className="capitalize">Partial</span>
        </div>
      );
    default:
      return null;
  }
};

const AnalysisMetadata: React.FC<{
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
  allowActions?: boolean;
  isOwner?: boolean;
}> = ({ teamSlug, projectSlug, nodeId, allowActions = false, isOwner = false }) => {
  const { isCopied, copy } = useCopyToClipboard();

  const { data: version, isPending } = useQuery({
    queryKey: generateQueryKey.analysis(nodeId),
    queryFn: async () =>
      analysisActions.getAnalysis(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  if (isPending || !version) {
    return (
      <div className="pt-3 pb-6" aria-busy="true" aria-label="Loading analysis details">
        <div className="h-10 max-w-2xl animate-pulse rounded-md bg-muted/50" />
      </div>
    );
  }

  return (
    <div className="pt-3 pb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap text-muted-foreground text-xs">
          <div className="flex items-center gap-1.5 text-xs">
            {version.is_public ? (
              <Globe className="size-3.5 text-blue-400" />
            ) : (
              <Lock className="size-3.5 text-muted-foreground" />
            )}
            <span className="text-muted-foreground">
              {version.is_public ? "Public" : "Private"}
            </span>
            {version.is_public && (
              <button
                onClick={() => copy(`${window.origin}/shared/${nodeId}`)}
                className="ml-0.5 p-0.5 hover:bg-muted rounded transition-colors"
                aria-label="Copy link"
              >
                {isCopied ? (
                  <Check className="size-3 text-green-400" />
                ) : (
                  <Copy className="size-3 text-muted-foreground" />
                )}
              </button>
            )}
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5 capitalize">
            {version.trigger.replace("_", " ")}
          </div>
          {(version.is_leaf || !version.parent_node_id) && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1 justify-start">
                {!version.parent_node_id && (
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 whitespace-nowrap shrink-0"
                    title="root"
                  >
                    <TreeDeciduous className="size-3" />
                  </span>
                )}
                {version.is_leaf && version.parent_node_id && (
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 whitespace-nowrap shrink-0"
                    title="leaf"
                  >
                    <Leaf className="size-3" />
                  </span>
                )}
              </div>
            </>
          )}
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <Icon size="xs" seed={version.user.id} className="shrink-0" />
            <span className="truncate">{version.user.username}</span>
            <span>·</span>
            <span>{formatDateShort(version.created_at)}</span>
          </div>
          {version.status !== "success" && (
            <>
              <div className="h-4 w-px bg-border" />
              {getStatusIndicator(version.status)}
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {allowActions && isOwner && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <RefreshCw className="size-4" />
                  Rerun
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 text-sm">
                <div className="flex gap-2.5">
                  <Info className="size-4 text-yellow-400 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">
                      Only rerun if something seems broken.
                    </p>
                    <p className="text-muted-foreground text-[13px] leading-relaxed">
                      For incremental changes or follow-up questions, the{" "}
                      <span className="text-foreground font-medium">chat feature</span> is faster
                      and more precise. A full rerun re-analyzes the entire codebase from scratch.
                    </p>
                    <Button size="sm" variant="outline" className="w-full mt-1" asChild>
                      <Link
                        href={`/team/${teamSlug}/${projectSlug}/analyses/new?parentVersionId=${encodeURIComponent(nodeId)}`}
                      >
                        Rerun Analysis
                      </Link>
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {allowActions ? (
            <AnalysisVersionMenu
              teamSlug={teamSlug}
              projectSlug={projectSlug}
              nodeId={nodeId}
              isOwner={isOwner}
              isPublic={version.is_public}
            />
          ) : (
            <Button variant="outline" asChild>
              <Link href={`/team/${teamSlug}/${projectSlug}/analyses/${nodeId}`}>Go To Source</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisMetadata;
