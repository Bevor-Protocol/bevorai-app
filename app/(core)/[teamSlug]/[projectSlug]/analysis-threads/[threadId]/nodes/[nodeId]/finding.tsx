"use client";

import { analysisActions, codeActions } from "@/actions/bevor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Subnav, SubnavButton } from "@/components/ui/subnav";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { FindingFeedbackBody } from "@/utils/schema";
import { FindingSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, ThumbsDown, ThumbsUp, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { toast } from "sonner";
import { FindingWithScope, getSeverityBadgeClasses, getSeverityColor } from "./scopes";

export const FindingMetadata: React.FC<{
  finding: FindingWithScope;
}> = ({ finding }) => {
  const isValidated = !!finding.validated_at;
  const isInvalidated = !!finding.invalidated_at;
  const isNotAcknowledged = !isValidated && !isInvalidated;

  return (
    <div className="flex items-center gap-3">
      <h3 className="text-lg font-semibold">{finding.name}</h3>
      <Badge variant="outline" className={cn("text-xs", getSeverityBadgeClasses(finding.level))}>
        {finding.level}
      </Badge>
      <span className="text-sm text-muted-foreground">
        {finding.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
      </span>
      {isValidated && (
        <Badge
          variant="outline"
          className="text-xs border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400"
        >
          <Check className="size-3 mr-1" />
          is validated
        </Badge>
      )}
      {isInvalidated && (
        <Badge
          variant="outline"
          className="text-xs border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
        >
          <X className="size-3 mr-1" />
          is invalidated
        </Badge>
      )}
      {isNotAcknowledged && (
        <Badge
          variant="outline"
          className="text-xs border-muted-foreground/20 bg-muted-foreground/10 text-muted-foreground"
        >
          finding not acknowledged
        </Badge>
      )}
    </div>
  );
};

export const CodeSnippet: React.FC<{
  teamSlug: string;
  projectSlug: string;
  codeVersionId: string;
  codeVersionNodeId: string;
}> = ({ teamSlug, projectSlug, codeVersionId, codeVersionNodeId }) => {
  const { data: nodeData, isLoading: isLoadingNode } = useQuery({
    queryKey: [QUERY_KEYS.CODES, codeVersionId, "nodes", codeVersionNodeId],
    queryFn: () => codeActions.getNode(teamSlug, codeVersionId, codeVersionNodeId),
    enabled: !!codeVersionNodeId,
  });

  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    if (!nodeData?.content) {
      setHtml("");
      return;
    }

    const highlightCode = async (): Promise<void> => {
      try {
        const result = await codeToHtml(nodeData.content, {
          lang: "solidity",
          theme: "github-dark",
          colorReplacements: {},
        });
        setHtml(result);
      } catch (error) {
        console.error("Error highlighting code:", error);
        const fallbackHtml = `<pre><code>${nodeData.content}</code></pre>`;
        setHtml(fallbackHtml);
      }
    };

    highlightCode();
  }, [nodeData?.content]);

  const sourceHref = `/${teamSlug}/${projectSlug}/codes/${codeVersionId}?source=${nodeData?.source_id}&node=${nodeData?.id}`;

  return (
    <div className="border rounded-lg relative">
      <div className="absolute top-0 right-0 z-10">
        <Button variant="ghost" size="sm" asChild>
          <Link href={sourceHref}>
            Source <ExternalLink className="size-3" />
          </Link>
        </Button>
      </div>
      <ScrollArea className="p-2 h-[200px]">
        {isLoadingNode || !html ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div
            className="shiki-container overflow-x-auto w-full"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export const FindingTabs: React.FC<{
  teamSlug: string;
  nodeId: string;
  finding: FindingWithScope;
  setSelectedFinding: React.Dispatch<React.SetStateAction<FindingWithScope | null>>;
}> = ({ teamSlug, nodeId, finding, setSelectedFinding }) => {
  const [tab, setTab] = useState("description");
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [pendingVerification, setPendingVerification] = useState<boolean | null>(null);
  const queryClient = useQueryClient();

  const submitFeedbackMutation = useMutation({
    mutationFn: ({ findingId, data }: { findingId: string; data: FindingFeedbackBody }) => {
      return analysisActions.submitFindingFeedback(teamSlug, nodeId, findingId, data);
    },
    onSuccess: (_, { findingId, data }) => {
      queryClient.setQueryData<FindingSchemaI[]>(
        generateQueryKey.analysisVersionFindings(nodeId),
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map((scope) => ({
            ...scope,
            findings: scope.findings.map((finding) => {
              if (finding.id === findingId) {
                const newFinding = {
                  ...finding,
                  feedback: data.feedback,
                  validated_at: data.is_verified ? new Date() : undefined,
                  invalidated_at: !data.is_verified ? new Date() : undefined,
                };
                setSelectedFinding({
                  ...newFinding,
                  scope,
                });
                return newFinding;
              }
              return finding;
            }),
          }));
        },
      );
      toast.success("Feedback submitted successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to submit feedback");
    },
  });

  useEffect(() => {
    if (finding) {
      setFeedbackText(finding?.feedback || "");
      setPendingVerification(finding.validated_at ? true : finding.invalidated_at ? false : null);
    }
  }, [finding]);

  const handleSubmitFeedback = (findingId: string, isVerified: boolean): void => {
    setPendingVerification(isVerified);
    submitFeedbackMutation.mutate({
      findingId,
      data: {
        feedback: feedbackText || undefined,
        is_verified: isVerified,
      },
    });
  };

  return (
    <div className={cn("border rounded-lg p-4", getSeverityColor(finding.level), "finding")}>
      <Subnav className="w-fit px-0 mb-4">
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
      {tab === "description" && (
        <div className="space-y-4">
          {finding.explanation && (
            <p className="text-sm text-muted-foreground leading-relaxed">{finding.explanation}</p>
          )}
          {finding.reference && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Reference</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{finding.reference}</p>
            </div>
          )}
          {!finding.explanation && !finding.reference && (
            <p className="text-sm text-muted-foreground">No description or reference available.</p>
          )}
        </div>
      )}
      {tab === "recommendation" && (
        <div className="space-y-2">
          {finding.recommendation ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {finding.recommendation}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No recommendation available.</p>
          )}
        </div>
      )}
      {tab === "feedback" && (
        <div className="space-y-4">
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Enter your feedback..."
            rows={4}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleSubmitFeedback(finding.id, true)}
                disabled={submitFeedbackMutation.isPending}
              >
                <ThumbsUp
                  className={cn(
                    "size-4 text-muted-foreground hover:text-foreground",
                    pendingVerification === true && "text-green-400",
                  )}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleSubmitFeedback(finding.id, false)}
                disabled={submitFeedbackMutation.isPending}
              >
                <ThumbsDown
                  className={cn(
                    "size-4 text-muted-foreground hover:text-foreground",
                    pendingVerification === false && "text-destructive",
                  )}
                />
              </Button>
            </div>
          </div>
          {finding?.feedback && !feedbackText && (
            <p className="text-xs text-muted-foreground italic">
              Current feedback: {finding.feedback}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
