"use client";

import { analysisActions } from "@/actions/bevor";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useChat } from "@/providers/chat";
import { useCode } from "@/providers/code";
import { DraftFindingSchema, FindingStatusEnum } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { truncateId } from "@/utils/helpers";
import { FindingUpdateBody } from "@/utils/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Eye,
  MessageSquare,
  Pencil,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { forwardRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { FindingFormDialog } from "./finding-form-dialog";

interface InlineFindingCardProps {
  finding: DraftFindingSchema;
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
  codeVersionId: string;
  /** Source file path for this finding’s anchor node (optional). */
  filePath?: string | null;
  isOwner: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  /** Select this finding in the code viewer and scroll to it (sidebar control). */
  onShowInCode?: () => void;
  validatedFindingNames?: Set<string>;
  onAddFindingToContext?: (finding: DraftFindingSchema) => void;
}

const SEVERITY_CONFIG: Record<
  string,
  { border: string; badge: string; dot: string; label: string }
> = {
  critical: {
    border: "border-l-red-500",
    badge: "bg-red-500/15 text-red-400 border-red-500/25 font-semibold",
    dot: "bg-red-500",
    label: "CRITICAL",
  },
  high: {
    border: "border-l-orange-500",
    badge: "bg-orange-500/15 text-orange-400 border-orange-500/25 font-semibold",
    dot: "bg-orange-500",
    label: "HIGH",
  },
  medium: {
    border: "border-l-yellow-500",
    badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25 font-semibold",
    dot: "bg-yellow-500",
    label: "MEDIUM",
  },
  low: {
    border: "border-l-blue-500",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/25 font-semibold",
    dot: "bg-blue-500",
    label: "LOW",
  },
};

const FINDING_STATUS_MENU: {
  value: FindingStatusEnum;
  label: string;
  compact: string;
  Icon: typeof CircleDot;
  itemClass: string;
}[] = [
  {
    value: FindingStatusEnum.UNRESOLVED,
    label: "Not acknowledged",
    compact: "Not acknowledged",
    Icon: CircleDot,
    itemClass: "text-zinc-400",
  },
  {
    value: FindingStatusEnum.VALIDATED,
    label: "Validated",
    compact: "Validated",
    Icon: ShieldCheck,
    itemClass: "text-green-400",
  },
  {
    value: FindingStatusEnum.INVALIDATED,
    label: "Invalidated",
    compact: "Invalid",
    Icon: X,
    itemClass: "text-red-400",
  },
  {
    value: FindingStatusEnum.REMEDIATED,
    label: "Remediated",
    compact: "Remediated",
    Icon: CheckCircle2,
    itemClass: "text-blue-400",
  },
];

const findingStatusMenuMap = Object.fromEntries(
  FINDING_STATUS_MENU.map((o) => [o.value, o]),
) as Record<FindingStatusEnum, (typeof FINDING_STATUS_MENU)[number]>;

const getSeverityConfig = (level: string): { [key: string]: string } =>
  SEVERITY_CONFIG[level.toLowerCase()] ?? {
    border: "border-l-zinc-500",
    badge: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25 font-semibold",
    dot: "bg-zinc-500",
    label: level.toUpperCase(),
  };

const FINDING_CARD_TABS = [
  { id: "description" as const, label: "Description" },
  { id: "recommendation" as const, label: "Recommendation" },
  { id: "feedback" as const, label: "Feedback" },
];

const InlineFindingCard = forwardRef<HTMLDivElement, InlineFindingCardProps>(
  (
    {
      finding,
      teamSlug,
      nodeId,
      codeVersionId,
      filePath,
      isOwner,
      isExpanded,
      onToggle,
      onShowInCode,
      onAddFindingToContext,
    },
    ref,
  ) => {
    void codeVersionId;
    const { handleFileChange, nodesQuery } = useCode();
    const { selectedChatId } = useChat();
    const [selectedNodeId, setSelectedNodeId] = useState<string>(finding.node_id);
    const [tab, setTab] = useState("description");
    const [feedback, setFeedback] = useState(finding.feedback);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteMode, setDeleteMode] = useState<"remove" | "revert">("remove");

    const queryClient = useQueryClient();

    const handleSelectedNodeId = (nodeId: string): void => {
      setSelectedNodeId(nodeId);
      if (!nodesQuery.data) return;
      const targetNode = nodesQuery.data.find((node) => node.id == nodeId);
      if (!targetNode) return;

      handleFileChange(targetNode.file_id, {
        start: targetNode.src_start_pos,
        end: targetNode.src_end_pos,
      });
    };

    const invalidateAnalysisFindings = (): void => {
      void queryClient.invalidateQueries({ queryKey: generateQueryKey.analysisFindings(nodeId) });
    };

    const updateMutation = useMutation({
      mutationFn: ({ findingId, data }: { findingId: string; data: FindingUpdateBody }) =>
        analysisActions.updateFinding(teamSlug, nodeId, findingId, data).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: generateQueryKey.analysisDetailed(nodeId) });
        invalidateAnalysisFindings();
        toast.success("Feedback submitted");
      },
      onError: () => toast.error("Failed to submit feedback"),
    });

    const stagedDeleteMutation = useMutation({
      mutationFn: ({ findingId }: { findingId: string; mode: "remove" | "revert" }) =>
        analysisActions.deleteStagedFinding(teamSlug, nodeId, findingId).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
      onSuccess: (_, { mode }) => {
        invalidateAnalysisFindings();
        toast.success(mode === "revert" ? "Change reverted" : "Finding removed");
        setDeleteOpen(false);
      },
      onError: (_, { mode }) =>
        toast.error(mode === "revert" ? "Failed to revert" : "Failed to remove finding"),
    });

    const pendingDelete = finding.operation === "delete";
    const canEditContent = isOwner && !pendingDelete;
    const canRevertDraft = isOwner && finding.is_draft;
    const canRemoveCommitted = isOwner && !finding.is_draft;
    const canUpdateFeedbackOrStatus = !pendingDelete;

    const statusMenuEntry = findingStatusMenuMap[finding.status];
    const StatusTriggerIcon = statusMenuEntry.Icon;

    const sevConfig = getSeverityConfig(finding.level);

    const affectedScopes = finding.affected_scopes ?? [];
    const hasAffectedScopes = affectedScopes.length > 0;
    const typeLabel = finding.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    return (
      <>
        <div
          ref={ref}
          className={cn(
            "my-1 w-full min-w-0 max-w-full overflow-hidden rounded-sm border border-border border-l-[3px] bg-zinc-950",
            sevConfig.border,
            pendingDelete && "opacity-60",
          )}
        >
          <div className="cursor-pointer select-none" onClick={onToggle}>
            <div className="flex min-w-0 max-w-full items-center gap-2 px-3 pt-2.5 pb-1">
              <div className="min-w-0 flex-1">
                {filePath ? (
                  <p className="truncate font-mono text-[10px] text-zinc-500" title={filePath}>
                    {filePath}
                  </p>
                ) : null}
              </div>
              <div
                className="flex shrink-0 flex-wrap items-center justify-end gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                {onShowInCode ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => onShowInCode()}
                    className="h-6 w-6 shrink-0 p-0 text-zinc-500 hover:text-zinc-300"
                    title="Show in code"
                  >
                    <Eye className="size-3.5" />
                  </Button>
                ) : null}
                {canEditContent ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditOpen(true)}
                    className="h-6 w-6 shrink-0 p-0 text-zinc-500 hover:text-zinc-300"
                    title="Edit finding"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                ) : null}
                {canRevertDraft ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeleteMode("revert");
                      setDeleteOpen(true);
                    }}
                    className="h-6 w-6 shrink-0 p-0 text-zinc-500 hover:text-zinc-300"
                    title="Revert staged change"
                  >
                    <Undo2 className="size-3.5" />
                  </Button>
                ) : null}
                {canRemoveCommitted ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeleteMode("remove");
                      setDeleteOpen(true);
                    }}
                    className="h-6 w-6 shrink-0 p-0 text-zinc-500 hover:text-red-400"
                    title="Remove finding"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                ) : null}
                {onAddFindingToContext && selectedChatId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddFindingToContext(finding)}
                    className="h-6 w-6 shrink-0 p-0 text-zinc-500 hover:text-zinc-300"
                    title="Add to chat context"
                  >
                    <MessageSquare className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>

            <div className="min-w-0 max-w-full px-3 pb-1.5">
              <p
                className="min-w-0 truncate text-[13px] font-semibold leading-snug text-foreground"
                title={finding.name}
              >
                {finding.name}
              </p>
            </div>

            <div className="flex w-full min-w-0 flex-wrap items-center gap-1.5 px-3 pb-2 pt-1">
              <span
                className={cn(
                  "inline-flex shrink-0 items-center truncate rounded border px-1.5 py-0.5 text-[10px] tracking-wider",
                  sevConfig.badge,
                )}
              >
                {sevConfig.label}
              </span>
              {typeLabel ? (
                <span
                  className="inline-flex min-w-0 max-w-[min(100%,24rem)] items-center truncate rounded border border-zinc-700/60 bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[11px] text-zinc-400"
                  title={typeLabel}
                >
                  {typeLabel}
                </span>
              ) : null}
              <span className="inline-flex shrink-0" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      disabled={!canUpdateFeedbackOrStatus || updateMutation.isPending}
                      className={cn(
                        "inline-flex min-w-0 max-w-[min(100%,12rem)] cursor-pointer items-center gap-1 rounded border border-zinc-700/60 bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[11px] leading-none transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:block [&_svg]:shrink-0",
                        statusMenuEntry.itemClass,
                      )}
                      title="Finding status"
                    >
                      <StatusTriggerIcon className="size-3" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{statusMenuEntry.compact}</span>
                      <ChevronDown className="size-3 opacity-60" aria-hidden />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    {FINDING_STATUS_MENU.map(({ value, label, Icon, itemClass }) => (
                      <DropdownMenuItem
                        key={value}
                        disabled={value === finding.status || updateMutation.isPending}
                        className={cn("text-sm", itemClass)}
                        onSelect={() =>
                          updateMutation.mutate({
                            findingId: finding.id,
                            data: { status: value },
                          })
                        }
                      >
                        <Icon className="size-3.5 shrink-0" />
                        {label}
                        {value === finding.status ? (
                          <Check className="size-3.5 ml-auto shrink-0 opacity-80" />
                        ) : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </span>
              {finding.is_draft ? (
                <span className="inline-flex items-center rounded border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">
                  Draft
                </span>
              ) : null}
              {finding.operation === "delete" ? (
                <span className="inline-flex items-center rounded border border-red-500/25 bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">
                  Pending removal
                </span>
              ) : null}
              {finding.operation && finding.operation !== "delete" ? (
                <span className="inline-flex items-center rounded border border-blue-500/25 bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400">
                  Staged {finding.operation}
                </span>
              ) : null}
            </div>
          </div>

          {isExpanded && (
            <div className="min-w-0 max-w-full border-t border-border">
              {hasAffectedScopes && (
                <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
                  <span
                    className="text-[11px] text-zinc-500 uppercase tracking-wide shrink-0"
                    title="Analysis scopes (entry points) affected by this finding"
                  >
                    Affected scopes
                  </span>
                  {affectedScopes.map((scopeNodeId, scopeIndex) => (
                    <button
                      key={`${scopeNodeId}-${scopeIndex}`}
                      type="button"
                      onClick={() => handleSelectedNodeId(scopeNodeId)}
                      className={cn(
                        "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-mono transition-colors border",
                        selectedNodeId === scopeNodeId
                          ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                          : "border-zinc-700/60 bg-zinc-800/40 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-300",
                      )}
                      title={scopeNodeId}
                    >
                      {truncateId(scopeNodeId)}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex min-w-0 max-w-full flex-col">
                <div className="flex min-w-0 max-w-full items-center px-2 py-1">
                  <div
                    className="no-scrollbar flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-x-auto"
                    role="tablist"
                  >
                    {FINDING_CARD_TABS.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={tab === id}
                        onClick={() => setTab(id)}
                        className={cn(
                          "shrink-0 rounded-md px-2 py-1 text-sm font-medium transition-colors",
                          tab === id
                            ? "bg-zinc-800 text-zinc-100"
                            : "text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-300",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="min-w-0 max-w-full px-3 py-3">
                  {tab === "description" && (
                    <div className="min-w-0 max-w-full space-y-3">
                      {finding.explanation && (
                        <div className="no-scrollbar min-w-0 max-w-full overflow-x-auto">
                          <ReactMarkdown className="markdown text-sm">
                            {finding.explanation}
                          </ReactMarkdown>
                        </div>
                      )}
                      {finding.reference && (
                        <div className="min-w-0 max-w-full space-y-1.5 border-t border-border pt-2">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                            Reference
                          </p>
                          <div className="no-scrollbar min-w-0 max-w-full overflow-x-auto">
                            <ReactMarkdown className="markdown text-sm">
                              {finding.reference}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                      {!finding.explanation && !finding.reference && (
                        <p className="text-[13px] text-zinc-500">No description available.</p>
                      )}
                    </div>
                  )}
                  {tab === "recommendation" && (
                    <div className="no-scrollbar min-w-0 max-w-full overflow-x-auto">
                      {finding.recommendation ? (
                        <ReactMarkdown className="markdown text-sm">
                          {finding.recommendation}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-[13px] text-zinc-500">No recommendation available.</p>
                      )}
                    </div>
                  )}
                  {tab === "feedback" && (
                    <div className="space-y-3">
                      {canUpdateFeedbackOrStatus ? (
                        <Textarea
                          value={feedback ?? ""}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Enter your feedback…"
                          rows={4}
                          className="text-[13px] bg-background border-border resize-none"
                        />
                      ) : finding.feedback?.trim() ? (
                        <p className="text-[13px] text-zinc-300 whitespace-pre-wrap">
                          {finding.feedback}
                        </p>
                      ) : (
                        <p className="text-[13px] text-zinc-500">No feedback.</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            updateMutation.mutate({
                              findingId: finding.id,
                              data: { feedback, status: FindingStatusEnum.VALIDATED },
                            })
                          }
                          disabled={!canUpdateFeedbackOrStatus || updateMutation.isPending}
                          className="text-zinc-500 hover:text-green-400 disabled:opacity-50"
                        >
                          <ThumbsUp
                            className={cn(
                              "size-4",
                              finding.status === FindingStatusEnum.VALIDATED && "text-green-400",
                            )}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            updateMutation.mutate({
                              findingId: finding.id,
                              data: { feedback, status: FindingStatusEnum.INVALIDATED },
                            })
                          }
                          disabled={!canUpdateFeedbackOrStatus || updateMutation.isPending}
                          className="text-zinc-500 hover:text-red-400 disabled:opacity-50"
                        >
                          <ThumbsDown
                            className={cn(
                              "size-4",
                              finding.status === FindingStatusEnum.INVALIDATED && "text-red-400",
                            )}
                          />
                        </Button>
                      </div>
                      {finding.feedback && !feedback && canUpdateFeedbackOrStatus && (
                        <p className="text-[11px] text-zinc-600 italic">
                          Current: {finding.feedback}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <FindingFormDialog
          mode="edit"
          teamSlug={teamSlug}
          nodeId={nodeId}
          finding={finding}
          open={editOpen}
          onOpenChange={setEditOpen}
        />

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteMode === "revert" ? "Revert this change?" : "Remove this finding?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteMode === "revert"
                  ? finding.operation === "delete"
                    ? "The finding will stay on this analysis; only the pending removal is dropped."
                    : finding.operation === "update"
                      ? "Your staged edits will be discarded and the previous version will show again."
                      : "This removes the staged finding you added."
                  : "This will stage removal on this analysis. The findings list refreshes so you see the updated draft state."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={stagedDeleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant={deleteMode === "revert" ? "default" : "destructive"}
                size="sm"
                disabled={stagedDeleteMutation.isPending}
                onClick={() =>
                  stagedDeleteMutation.mutate({ findingId: finding.id, mode: deleteMode })
                }
              >
                {deleteMode === "revert" ? "Revert" : "Remove"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  },
);
InlineFindingCard.displayName = "InlineFindingCard";

export default InlineFindingCard;
