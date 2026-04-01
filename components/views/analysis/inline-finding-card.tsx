"use client";

import { analysisActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Subnav, SubnavButton } from "@/components/ui/subnav";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useChat } from "@/providers/chat";
import { FindingSchema, FindingStatusEnum } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { truncateId } from "@/utils/helpers";
import { FindingUpdateBody } from "@/utils/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldCheck,
  ShieldPlus,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { forwardRef, JSX, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import AnalysisCodeSnippet from "./snippet";

interface InlineFindingCardProps {
  finding: FindingSchema;
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
  codeVersionId: string;
  isExpanded: boolean;
  onToggle: () => void;
  validatedFindingNames?: Set<string>;
  onAddFindingToContext?: (finding: FindingSchema) => void;
}

// ── Severity helpers ─────────────────────────────────────────────────────────

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

// ── Component ────────────────────────────────────────────────────────────────

const InlineFindingCard = forwardRef<HTMLDivElement, InlineFindingCardProps>(
  (
    { finding, teamSlug, nodeId, codeVersionId, isExpanded, onToggle, onAddFindingToContext },
    ref,
  ) => {
    const { selectedChatId } = useChat();
    const [selectedNodeId, setSelectedNodeId] = useState<string>(finding.node_id);
    const [tab, setTab] = useState("description");
    const [feedback, setFeedback] = useState(finding.feedback);

    const queryClient = useQueryClient();

    const updateMutation = useMutation({
      mutationFn: ({ findingId, data }: { findingId: string; data: FindingUpdateBody }) =>
        analysisActions.updateFinding(teamSlug, nodeId, findingId, data).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: generateQueryKey.analysisDetailed(nodeId) });
        toast.success("Feedback submitted");
      },
      onError: () => toast.error("Failed to submit feedback"),
    });

    const sevConfig = getSeverityConfig(finding.level);

    const hasLocations = finding.locations?.length > 0;
    const locationOptions = [
      { source_node_id: finding.node_id, field_name: "entrypoint" },
      ...finding.locations,
    ];

    const typeLabel = finding.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    return (
      <div
        ref={ref}
        className={cn(
          "border-l-[3px] my-1 mx-2 rounded-sm overflow-hidden",
          "bg-zinc-950 border border-border border-l-[3px]",
          sevConfig.border,
        )}
      >
        {/* ── Collapsed header ─────────────────────────────────────────────── */}
        <div className="flex items-start gap-0 cursor-pointer select-none" onClick={onToggle}>
          {/* Left meta column */}
          <div className="flex-1 min-w-0 px-3 pt-2.5 pb-2">
            {/* Row 1: severity badge + finding name */}
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

            {/* Row 2: type chip + status chip */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-mono bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                {typeLabel}
              </span>
              {getFindingStatusText(finding.status)}
            </div>
          </div>

          {/* Right actions column */}
          <div
            className="flex items-center gap-1.5 px-3 pt-2.5 pb-2 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {finding.status == FindingStatusEnum.VALIDATED ? (
              <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] bg-green-500/10 text-green-400 border border-green-500/20 cursor-default">
                <ShieldCheck className="size-3" />
                Validated
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateMutation.mutate({
                    findingId: finding.id,
                    data: { status: FindingStatusEnum.VALIDATED },
                  })
                }
                className="h-6 text-[11px] px-2 gap-1 text-zinc-400 hover:text-foreground border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/60"
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
            {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        </div>

        {isExpanded && (
          <div className="border-t border-border">
            {/* Locations */}
            {hasLocations && (
              <div className="flex items-center gap-2 flex-wrap px-3 py-2 border-b border-border">
                <span className="text-[11px] text-zinc-500 uppercase tracking-wide">Locations</span>
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

            <div className="border-b border-border bg-background">
              <AnalysisCodeSnippet
                teamSlug={teamSlug}
                codeId={codeVersionId}
                nodeId={selectedNodeId}
              />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
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

              <div className="px-3 py-3">
                {tab === "description" && (
                  <div className="space-y-3">
                    {finding.explanation && (
                      <ReactMarkdown className="markdown text-[13px] leading-relaxed">
                        {finding.explanation}
                      </ReactMarkdown>
                    )}
                    {finding.reference && (
                      <div className="space-y-1.5 pt-2 border-t border-border">
                        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                          Reference
                        </p>
                        <ReactMarkdown className="markdown text-[13px] leading-relaxed">
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
                  <div>
                    {finding.recommendation ? (
                      <ReactMarkdown className="markdown text-[13px] leading-relaxed">
                        {finding.recommendation}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-[13px] text-zinc-500">No recommendation available.</p>
                    )}
                  </div>
                )}
                {tab === "feedback" && (
                  <div className="space-y-3">
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Enter your feedback..."
                      rows={4}
                      className="text-[13px] bg-background border-border resize-none"
                    />
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
                        disabled={updateMutation.isPending}
                        className="text-zinc-500 hover:text-green-400"
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
                        disabled={updateMutation.isPending}
                        className="text-zinc-500 hover:text-red-400"
                      >
                        <ThumbsDown
                          className={cn(
                            "size-4",
                            finding.status === FindingStatusEnum.INVALIDATED && "text-red-400",
                          )}
                        />
                      </Button>
                    </div>
                    {finding.feedback && !feedback && (
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
    );
  },
);
InlineFindingCard.displayName = "InlineFindingCard";

export default InlineFindingCard;
