"use client";

import { analysisActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Subnav, SubnavButton } from "@/components/ui/subnav";
import { cn } from "@/lib/utils";
import { FindingSchema, FindingStatusEnum } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { truncateId } from "@/utils/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, ChevronDown, ChevronUp } from "lucide-react";
import { FC, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type SeverityStyle = { border: string; badge: string; label: string };

const SEVERITY_CONFIG: Record<string, SeverityStyle> = {
  critical: {
    border: "border-l-red-500",
    badge: "bg-red-500/15 text-red-400 border-red-500/25 font-semibold",
    label: "CRITICAL",
  },
  high: {
    border: "border-l-orange-500",
    badge: "bg-orange-500/15 text-orange-400 border-orange-500/25 font-semibold",
    label: "HIGH",
  },
  medium: {
    border: "border-l-yellow-500",
    badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25 font-semibold",
    label: "MEDIUM",
  },
  low: {
    border: "border-l-blue-500",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/25 font-semibold",
    label: "LOW",
  },
};

const getSeverityConfig = (level: string): SeverityStyle =>
  SEVERITY_CONFIG[level.toLowerCase()] ?? {
    border: "border-l-zinc-500",
    badge: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25 font-semibold",
    label: level.toUpperCase(),
  };

const formatType = (type: string | undefined | null): string => {
  if (type == null || type === "") return "";
  return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export const RemediationFindingCard: FC<{
  finding: FindingSchema;
  teamSlug: string;
  isExpanded: boolean;
  onToggle: () => void;
  onAfterRemediation: () => void;
}> = ({ finding, teamSlug, isExpanded, onToggle, onAfterRemediation }) => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"description" | "recommendation" | "feedback">("description");

  const analysisId = finding.analysis_id;
  const sevConfig = getSeverityConfig(finding.level);
  const typeLabel = formatType(finding.type);
  const affectedScopes = finding.affected_scopes ?? [];
  const hasAffectedScopes = affectedScopes.length > 0;

  const remediateMutation = useMutation({
    mutationFn: () =>
      analysisActions
        .updateFinding(teamSlug, analysisId, finding.id, { status: FindingStatusEnum.REMEDIATED })
        .then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: generateQueryKey.analysisFindings(analysisId),
      });
      void queryClient.invalidateQueries({
        queryKey: generateQueryKey.analysisDetailed(analysisId),
      });
      toast.success("Marked as remediated");
      onAfterRemediation();
    },
    onError: () => toast.error("Failed to mark as remediated"),
  });

  const isRemediated = finding.status === FindingStatusEnum.REMEDIATED;
  const canMarkRemediated = !isRemediated;

  return (
    <div
      className={cn(
        "my-1 w-full min-w-0 max-w-full overflow-hidden rounded-sm border border-border border-l-[3px] bg-zinc-950",
        sevConfig.border,
      )}
    >
      <div className="flex cursor-pointer select-none items-start gap-0" onClick={onToggle}>
        <div className="min-w-0 flex-1 px-3 pb-2 pt-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wider",
                sevConfig.badge,
              )}
            >
              {sevConfig.label}
            </span>
            <span
              className="min-w-0 truncate text-[13px] font-semibold leading-snug text-foreground"
              title={finding.name}
            >
              {finding.name}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {typeLabel ? (
              <span className="inline-flex items-center rounded border border-zinc-700/60 bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[11px] text-zinc-400">
                {typeLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div
          className="flex shrink-0 items-center gap-1.5 px-3 pb-2 pt-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          {isRemediated ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[11px] text-blue-400 cursor-default">
              <CheckCheck className="size-3" />
              Remediated
            </span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={!canMarkRemediated || remediateMutation.isPending}
              onClick={() => remediateMutation.mutate()}
              className="h-6 shrink-0 gap-1 border-zinc-700 bg-zinc-800/50 px-2 text-[11px] text-zinc-400 hover:bg-zinc-700/60 hover:text-foreground disabled:opacity-60"
            >
              <CheckCheck className="size-3" />
              Mark remediated
            </Button>
          )}
        </div>

        <button
          type="button"
          className="flex px-2.5 pb-2 pt-3 text-zinc-500 transition-colors hover:text-zinc-300"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="min-w-0 max-w-full border-t border-border">
          {hasAffectedScopes && (
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
              <span className="shrink-0 text-[11px] uppercase tracking-wide text-zinc-500">
                Affected scopes
              </span>
              {affectedScopes.map((scopeNodeId, scopeIndex) => (
                <span
                  key={`${scopeNodeId}-${scopeIndex}`}
                  className="inline-flex items-center rounded border border-zinc-700/60 bg-zinc-800/40 px-2 py-0.5 font-mono text-[11px] text-zinc-400"
                  title={scopeNodeId}
                >
                  {truncateId(scopeNodeId)}
                </span>
              ))}
            </div>
          )}

          <div className="flex min-w-0 max-w-full flex-col">
            <div className="flex min-w-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
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
              <span className="rounded border border-zinc-700/40 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600">
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
                <div className="min-w-0">
                  {finding.feedback?.trim() ? (
                    <p className="whitespace-pre-wrap text-[13px] text-zinc-300">
                      {finding.feedback}
                    </p>
                  ) : (
                    <p className="text-[13px] text-zinc-500">No feedback.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
