"use client";

import { analysisActions, projectActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ContractAddressStep from "@/components/views/upload/explorer";
import FileStep from "@/components/views/upload/file";
import FolderStep from "@/components/views/upload/folder";
import { PasteCodeStep } from "@/components/views/upload/paste";
import RepoUrlStep from "@/components/views/upload/public_repo";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import type { ProjectDetailedSchema } from "@/types/api/responses/business";
import { AnalysisNodeSchema } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { formatDateShort } from "@/utils/helpers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  Copy,
  FileEdit,
  Folder,
  GitCommitHorizontal,
  Globe,
  Info,
  Leaf,
  ListChecks,
  Lock,
  MoveLeft,
  Plus,
  RefreshCw,
  TreeDeciduous,
  Upload,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import AnalysisVersionMenu from "./menu";
import { RemediationFindingCard } from "./remediation-finding-card";

type AnalysisNewCodeMethod = "file" | "paste" | "folder" | "scan" | "repo";

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
  const [expandedRemediationFindingId, setExpandedRemediationFindingId] = useState<string | null>(
    null,
  );
  const [newCodeOptionsOpen, setNewCodeOptionsOpen] = useState(false);
  const [newCodeDialogOpen, setNewCodeDialogOpen] = useState(false);
  const [newCodeMethod, setNewCodeMethod] = useState<AnalysisNewCodeMethod | null>(null);
  const [newCodeError, setNewCodeError] = useState<string | null>(null);

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

  const { data: remediationCandidates = [], isPending: remediationPending } = useQuery({
    queryKey: generateQueryKey.analysisRemediationCandidates(nodeId),
    queryFn: () =>
      analysisActions.getRemediationCandidates(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: version?.status === "partial" || version?.status === "success",
  });

  const commitDraftMutation = useMutation({
    mutationFn: () =>
      analysisActions.commitDraft(teamSlug, nodeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ id }) => {
      void queryClient.invalidateQueries({ queryKey: generateQueryKey.analysisFindings(nodeId) });
      void queryClient.invalidateQueries({
        queryKey: generateQueryKey.analysisRemediationCandidates(nodeId),
      });
      void queryClient.invalidateQueries({ queryKey: generateQueryKey.analysis(nodeId) });
      toast.success("Changes committed");
      router.push(`/team/${teamSlug}/${projectSlug}/analyses/${id}`);
    },
    onError: () => toast.error("Failed to commit changes"),
  });

  const ensureExistingProject = useCallback(
    async (tags: string[]): Promise<ProjectDetailedSchema> => {
      void tags;
      const res = await projectActions.getProject(teamSlug, projectSlug);
      if (!res.ok) {
        throw new Error(
          typeof res.error === "object" && res.error != null && "message" in res.error
            ? String((res.error as { message?: string }).message)
            : "Failed to load project",
        );
      }
      return res.data;
    },
    [teamSlug, projectSlug],
  );

  const captureEnsureProject = useCallback(
    async (tags: string[]): Promise<ProjectDetailedSchema> => {
      try {
        return await ensureExistingProject(tags);
      } catch (err) {
        setNewCodeError(err instanceof Error ? err.message : "Failed to load project");
        throw err;
      }
    },
    [ensureExistingProject],
  );

  const handleNewCodeSuccess = useCallback(
    (analysisId: string): void => {
      setNewCodeDialogOpen(false);
      setNewCodeMethod(null);
      setNewCodeError(null);
      router.push(`/team/${teamSlug}/${projectSlug}/analyses/${analysisId}`);
    },
    [teamSlug, projectSlug, router],
  );

  const openNewCodeUpload = (m: AnalysisNewCodeMethod): void => {
    setNewCodeMethod(m);
    setNewCodeDialogOpen(true);
    setNewCodeOptionsOpen(false);
    setNewCodeError(null);
  };

  const resetNewCodeFlow = useCallback((): void => {
    setNewCodeError(null);
  }, []);

  const invalidateAfterRemediation = useCallback((): void => {
    void queryClient.invalidateQueries({
      queryKey: generateQueryKey.analysisRemediationCandidates(nodeId),
    });
    void queryClient.invalidateQueries({
      queryKey: generateQueryKey.validatedFindings(projectSlug),
    });
    void queryClient.invalidateQueries({
      queryKey: generateQueryKey.analysisFindings(nodeId),
    });
  }, [queryClient, nodeId, projectSlug]);

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
          {version.status !== "waiting" && version.status !== "processing" && (
            <>
              <div className="h-4 w-px bg-border" />
              {remediationPending ? (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <ListChecks className="size-3.5 shrink-0" aria-hidden />
                  <span>…</span>
                </span>
              ) : (
                <Popover
                  onOpenChange={(open) => {
                    if (!open) setExpandedRemediationFindingId(null);
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <ListChecks className="size-3.5 shrink-0" aria-hidden />
                      <span className="tabular-nums text-foreground/90">
                        {remediationCandidates.length}
                      </span>
                      <span>for remediation</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={6}
                    collisionPadding={16}
                    className="w-[min(36rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] p-0"
                  >
                    <div className="border-b border-border px-3 py-2.5">
                      <p className="text-sm font-medium text-foreground">Ready for remediation</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                        These findings are already validated. Review details, then mark remediated
                        when the issue is fixed (or use the project board).
                      </p>
                    </div>
                    {remediationCandidates.length === 0 ? (
                      <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                        No findings in this state right now.
                      </p>
                    ) : (
                      <ScrollArea className="h-[min(400px,calc(100vh-10rem))]">
                        <div className="min-w-0 space-y-2 py-2 pl-2 pr-3">
                          {remediationCandidates.map((finding) => (
                            <RemediationFindingCard
                              key={finding.id}
                              finding={finding}
                              teamSlug={teamSlug}
                              isExpanded={expandedRemediationFindingId === finding.id}
                              onAfterRemediation={invalidateAfterRemediation}
                              onToggle={() =>
                                setExpandedRemediationFindingId((cur) =>
                                  cur === finding.id ? null : finding.id,
                                )
                              }
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                    <div className="border-t border-border px-3 py-2">
                      <Link
                        href={`/team/${teamSlug}/${projectSlug}/kanban`}
                        className="text-xs font-medium text-foreground/90 underline-offset-2 hover:text-foreground hover:underline"
                      >
                        Open project board
                      </Link>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </>
          )}
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
            <>
              {isOwner ? (
                <>
                  <DropdownMenu open={newCodeOptionsOpen} onOpenChange={setNewCodeOptionsOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" type="button">
                        <Plus className="size-4" />
                        New code
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                        Upload method
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => openNewCodeUpload("file")}
                      >
                        <Upload className="size-4 text-blue-400" />
                        Upload file
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => openNewCodeUpload("paste")}
                      >
                        <FileEdit className="size-4 text-emerald-400" />
                        Write / paste
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => openNewCodeUpload("folder")}
                      >
                        <Folder className="size-4 text-yellow-400" />
                        Upload folder
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => openNewCodeUpload("scan")}
                      >
                        <Globe className="size-4 text-purple-400" />
                        Explorer scan
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => openNewCodeUpload("repo")}
                      >
                        <GitCommitHorizontal className="size-4" />
                        Public repository
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Dialog
                    open={newCodeDialogOpen}
                    onOpenChange={(open) => {
                      setNewCodeDialogOpen(open);
                      if (!open) {
                        setNewCodeMethod(null);
                        resetNewCodeFlow();
                      }
                    }}
                  >
                    {newCodeMethod && (
                      <DialogContent
                        className="flex max-h-[85vh] w-full max-w-6xl flex-col gap-4 overflow-hidden p-6"
                        showCloseButton
                      >
                        {newCodeError ? (
                          <p className="flex shrink-0 items-center gap-2 text-sm text-destructive">
                            <XCircle className="size-4 shrink-0" />
                            {newCodeError}
                          </p>
                        ) : null}
                        <Button
                          variant="ghost"
                          className="mb-4 shrink-0 self-start"
                          type="button"
                          onClick={() => {
                            setNewCodeDialogOpen(false);
                            setNewCodeOptionsOpen(true);
                            resetNewCodeFlow();
                          }}
                        >
                          <MoveLeft />
                          Back to methods
                        </Button>
                        {newCodeMethod === "file" && (
                          <FileStep
                            ensureProject={captureEnsureProject}
                            parentAnalysisId={version.id}
                            onSuccess={handleNewCodeSuccess}
                          />
                        )}
                        {newCodeMethod === "paste" && (
                          <PasteCodeStep
                            key={version.id}
                            ensureProject={captureEnsureProject}
                            parentAnalysisId={version.id}
                            onSuccess={handleNewCodeSuccess}
                          />
                        )}
                        {newCodeMethod === "folder" && (
                          <FolderStep
                            ensureProject={captureEnsureProject}
                            parentAnalysisId={version.id}
                            onSuccess={handleNewCodeSuccess}
                          />
                        )}
                        {newCodeMethod === "scan" && (
                          <ContractAddressStep
                            ensureProject={captureEnsureProject}
                            parentAnalysisId={version.id}
                            onSuccess={handleNewCodeSuccess}
                          />
                        )}
                        {newCodeMethod === "repo" && (
                          <RepoUrlStep
                            ensureProject={captureEnsureProject}
                            parentAnalysisId={version.id}
                            onSuccess={handleNewCodeSuccess}
                          />
                        )}
                      </DialogContent>
                    )}
                  </Dialog>
                </>
              ) : null}

              <AnalysisVersionMenu
                teamSlug={teamSlug}
                projectSlug={projectSlug}
                nodeId={nodeId}
                isOwner={isOwner}
                isPublic={version.is_public}
              />
            </>
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
