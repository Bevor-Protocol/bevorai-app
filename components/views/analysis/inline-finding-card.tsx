"use client";

import { analysisActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Subnav, SubnavButton } from "@/components/ui/subnav";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useChat } from "@/providers/chat";
import { DraftFindingSchema, FindingStatusEnum } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { truncateId } from "@/utils/helpers";
import { FindingUpdateBody } from "@/utils/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Pencil,
  ShieldCheck,
  ShieldPlus,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { forwardRef, JSX, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { FindingFormDialog } from "./finding-form-dialog";

interface InlineFindingCardProps {
  finding: DraftFindingSchema;
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
  codeVersionId: string;
  isOwner: boolean;
  isExpanded: boolean;
  onToggle: () => void;
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

const getFindingStatusText = (status: FindingStatusEnum): JSX.Element => {
  if (status === FindingStatusEnum.VALIDATED) {
    return (
      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] bg-green-500/10 text-green-400 border border-green-500/20">
        <Check className="size-2.5" />
        validated
      </span>
    );
  }
  if (status === FindingStatusEnum.INVALIDATED) {
    return (
      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] bg-red-500/10 text-red-400 border border-red-500/20">
        <X className="size-2.5" />
        invalidated
      </span>
    );
  }
  if (status === FindingStatusEnum.UNRESOLVED) {
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] bg-zinc-800/60 text-zinc-500 border border-zinc-700/40">
        not acknowledged
      </span>
    );
  }

  return <></>;
};

const getSeverityConfig = (level: string): { [key: string]: string } =>
  SEVERITY_CONFIG[level.toLowerCase()] ?? {
    border: "border-l-zinc-500",
    badge: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25 font-semibold",
    dot: "bg-zinc-500",
    label: level.toUpperCase(),
  };

const InlineFindingCard = forwardRef<HTMLDivElement, InlineFindingCardProps>(
  (
    {
      finding,
      teamSlug,
      nodeId,
      codeVersionId,
      isOwner,
      isExpanded,
      onToggle,
      onAddFindingToContext,
    },
    ref,
  ) => {
    void codeVersionId;
    const { selectedChatId } = useChat();
    const [selectedNodeId, setSelectedNodeId] = useState<string>(finding.node_id);
    const [tab, setTab] = useState("description");
    const [feedback, setFeedback] = useState(finding.feedback);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteMode, setDeleteMode] = useState<"remove" | "revert">("remove");

    const queryClient = useQueryClient();

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

    const sevConfig = getSeverityConfig(finding.level);

    const affectedScopes = finding.affected_scopes ?? [];
    const hasAffectedScopes = affectedScopes.length > 0;

    const hasLocations = finding.locations?.length > 0;
    const locationOptions = [
      { source_node_id: finding.node_id, field_name: "entrypoint" },
      ...finding.locations,
    ];

    const typeLabel =
      finding.type == null || finding.type === ""
        ? ""
        : finding.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    return (
      <>
        <div
          ref={ref}
          className={cn(
            "border-l-[3px] my-1 mx-2 rounded-sm overflow-hidden min-w-0 max-w-full",
            "bg-zinc-950 border border-border border-l-[3px]",
            sevConfig.border,
            pendingDelete && "opacity-60",
          )}
        >
          <div className="flex items-start gap-0 cursor-pointer select-none" onClick={onToggle}>
            <div className="flex-1 min-w-0 px-3 pt-2.5 pb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] tracking-wider border shrink-0",
                    sevConfig.badge,
                  )}
                >
                  {sevConfig.label}
                </span>
                <span
                  className="text-[13px] font-semibold text-foreground truncate min-w-0 leading-snug"
                  title={finding.name}
                >
                  {finding.name}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {typeLabel ? (
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-mono bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                    {typeLabel}
                  </span>
                ) : null}
                {getFindingStatusText(finding.status)}
                {finding.is_draft ? (
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/25">
                    Draft
                  </span>
                ) : null}
                {finding.operation === "delete" ? (
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] bg-red-500/10 text-red-400 border border-red-500/25">
                    Pending removal
                  </span>
                ) : null}
                {finding.operation && finding.operation !== "delete" ? (
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/25">
                    Staged {finding.operation}
                  </span>
                ) : null}
              </div>
            </div>

            <div
              className="flex items-center gap-1.5 px-3 pt-2.5 pb-2 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {canEditContent ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                  className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-300"
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
                  className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-300"
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
                  className="h-6 w-6 p-0 text-zinc-500 hover:text-red-400"
                  title="Remove finding"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              ) : null}
              {finding.status == FindingStatusEnum.VALIDATED ? (
                <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] bg-green-500/10 text-green-400 border border-green-500/20 cursor-default">
                  <ShieldCheck className="size-3" />
                  Validated
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canUpdateFeedbackOrStatus}
                  onClick={() =>
                    updateMutation.mutate({
                      findingId: finding.id,
                      data: { status: FindingStatusEnum.VALIDATED },
                    })
                  }
                  className="h-6 text-[11px] px-2 gap-1 text-zinc-400 hover:text-foreground border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/60 disabled:opacity-60"
                >
                  <ShieldPlus className="size-3" />
                  Validate
                </Button>
              )}

              {onAddFindingToContext && selectedChatId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddFindingToContext(finding)}
                  className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-300"
                  title="Add to chat context"
                >
                  <MessageSquare className="size-3.5" />
                </Button>
              )}
            </div>
            <button
              className="flex items-start px-2.5 pt-3 text-zinc-500 hover:text-zinc-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              {isExpanded ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>
          </div>

          {isExpanded && (
            <div className="min-w-0 max-w-full border-t border-border">
              {hasAffectedScopes && (
                <div className="flex items-center gap-2 flex-wrap px-3 py-2 border-b border-border">
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
                      onClick={() => setSelectedNodeId(scopeNodeId)}
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

              {hasLocations && (
                <div className="flex items-center gap-2 flex-wrap px-3 py-2 border-b border-border">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wide">
                    Locations
                  </span>
                  {locationOptions.map((location, index) => (
                    <button
                      key={`${location.source_node_id}-${location.field_name ?? "node"}-${index}`}
                      type="button"
                      onClick={() => setSelectedNodeId(location.source_node_id)}
                      className={cn(
                        "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-mono transition-colors border",
                        selectedNodeId === location.source_node_id
                          ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                          : "border-zinc-700/60 bg-zinc-800/40 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-300",
                      )}
                    >
                      {location.field_name
                        ? `${location.field_name} · ${truncateId(location.source_node_id)}`
                        : truncateId(location.source_node_id)}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex min-w-0 max-w-full flex-col">
                <div className="flex min-w-0 items-center justify-between gap-2 px-3 py-2 border-b border-border">
                  <Subnav className="w-fit px-0">
                    <SubnavButton
                      isActive={tab === "description"}
                      shouldHighlight
                      onClick={() => setTab("description")}
                    >
                      Description
                    </SubnavButton>
                    <SubnavButton
                      isActive={tab === "recommendation"}
                      shouldHighlight
                      onClick={() => setTab("recommendation")}
                    >
                      Recommendation
                    </SubnavButton>
                    <SubnavButton
                      isActive={tab === "feedback"}
                      shouldHighlight
                      onClick={() => setTab("feedback")}
                    >
                      Feedback
                    </SubnavButton>
                  </Subnav>
                  <span className="text-[10px] font-mono text-zinc-600 border border-zinc-700/40 rounded px-1.5 py-0.5">
                    {truncateId(finding.id)}
                  </span>
                </div>

                <div className="min-w-0 max-w-full px-3 py-3">
                  {tab === "description" && (
                    <div className="min-w-0 max-w-full space-y-3">
                      {finding.explanation && (
                        <ReactMarkdown className="markdown text-sm">
                          {finding.explanation}
                        </ReactMarkdown>
                      )}
                      {finding.reference && (
                        <div className="min-w-0 max-w-full space-y-1.5 border-t border-border pt-2">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                            Reference
                          </p>
                          <ReactMarkdown className="markdown text-sm">
                            {finding.reference}
                          </ReactMarkdown>
                        </div>
                      )}
                      {!finding.explanation && !finding.reference && (
                        <p className="text-[13px] text-zinc-500">No description available.</p>
                      )}
                    </div>
                  )}
                  {tab === "recommendation" && (
                    <div className="min-w-0 max-w-full">
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
