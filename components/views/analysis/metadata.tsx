"use client";

import { analysisActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { AnalysisNodeSchema } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { formatDateShort } from "@/utils/helpers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  const router = useRouter();
  const { isCopied, copy } = useCopyToClipboard();
  const queryClient = useQueryClient();

  const { data: version, isPending } = useQuery({
    queryKey: generateQueryKey.analysis(nodeId),
    queryFn: async () =>
      analysisActions.getAnalysis(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const { data: findings } = useQuery({
    queryKey: generateQueryKey.analysisFindings(nodeId),
    queryFn: () =>
      analysisActions.getAnalysisFindings(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const commitDraftMutation = useMutation({
    mutationFn: () =>
      analysisActions.commitDraft(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ id }) => {
      void queryClient.invalidateQueries({ queryKey: generateQueryKey.analysisFindings(nodeId) });
      void queryClient.invalidateQueries({ queryKey: generateQueryKey.analysis(nodeId) });
      toast.success("Changes committed");
      router.push(`/team/${teamSlug}/${projectSlug}/analyses/${id}`);
    },
    onError: () => toast.error("Failed to commit changes"),
  });

  if (isPending || !version) {
    return (
      <div className="pt-3 pb-6" aria-busy="true" aria-label="Loading analysis details">
        <div className="h-10 max-w-2xl animate-pulse rounded-md bg-muted/50" />
      </div>
    );
  }

  const rerunHref = `/team/${teamSlug}/${projectSlug}/analyses/new?parentVersionId=${encodeURIComponent(nodeId)}`;
  const canRerun = version.status === "partial";
  const hasDraftFindings = (findings ?? []).some((f) => f.is_draft);

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
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-0.5 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      aria-label="About rerun"
                    >
                      <Info className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="start"
                    className="max-w-xs text-[13px] leading-snug"
                  >
                    {canRerun ? (
                      <p>
                        <span className="font-medium text-foreground">Partial analysis.</span> Rerun
                        starts a new full analysis of the codebase. Use it when incomplete or failed
                        scopes leave results you do not trust. For smaller follow-ups,{" "}
                        <span className="font-medium text-foreground">chat</span> is usually faster.
                      </p>
                    ) : (
                      <p>
                        <span className="font-medium text-foreground">
                          Rerun is only enabled when there was an issue during processing.
                        </span>{" "}
                        When some scopes do not finish successfully, status shows Partial and you
                        can rerun. A rerun re-analyzes the failed segments of the codebase only; use{" "}
                        <span className="font-medium text-foreground">chat</span> for incremental
                        questions.
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
                {canRerun ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={rerunHref}>
                      <RefreshCw className="size-4" />
                      Rerun
                    </Link>
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" disabled>
                    <RefreshCw className="size-4" />
                    Rerun
                  </Button>
                )}
              </div>
              {hasDraftFindings ? (
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  disabled={commitDraftMutation.isPending}
                  onClick={() => commitDraftMutation.mutate()}
                >
                  Commit changes
                </Button>
              ) : null}
            </div>
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
