"use client";

import { analysisActions } from "@/actions/bevor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Subnav, SubnavButton } from "@/components/ui/subnav";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { truncateId } from "@/utils/helpers";
import { FindingFeedbackBody } from "@/utils/schema";
import { AnalysisNodeSchemaI, FindingSchemaI } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const FindingDescription: React.FC<{
  teamSlug: string;
  nodeId: string;
  finding: FindingSchemaI;
  setSelectedFinding: (finding?: FindingSchemaI) => void;
}> = ({ teamSlug, nodeId, finding, setSelectedFinding }) => {
  const [tab, setTab] = useState("description");
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [pendingVerification, setPendingVerification] = useState<boolean | null>(null);
  const queryClient = useQueryClient();

  const submitFeedbackMutation = useMutation({
    mutationFn: ({ findingId, data }: { findingId: string; data: FindingFeedbackBody }) => {
      return analysisActions.submitFindingFeedback(teamSlug, nodeId, findingId, data).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      });
    },
    onSuccess: (_, { findingId, data }) => {
      queryClient.setQueryData<AnalysisNodeSchemaI>(
        generateQueryKey.analysisFindings(nodeId),
        (oldData) => {
          if (!oldData) return oldData;
          const oldFindings = oldData.findings;
          const newFindings = oldFindings.map((finding) => {
            const scope = oldData.scopes.find(
              (scope) => finding.code_version_node_id == scope.code_version_node_id,
            );
            if (finding.id === findingId && scope) {
              const newFinding = {
                ...finding,
                feedback: data.feedback,
                validated_at: data.is_verified ? new Date() : undefined,
                invalidated_at: !data.is_verified ? new Date() : undefined,
              };
              setSelectedFinding(newFinding);
              return newFinding;
            }
            return finding;
          });
          oldData.findings = newFindings;
          return oldData;
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
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between shrink-0 px-4 py-2">
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
        <Badge variant="outline" size="sm">
          {truncateId(finding.id)}
        </Badge>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        {tab === "description" && (
          <div className="p-4">
            {finding.explanation && (
              <ReactMarkdown className="markdown">{finding.explanation}</ReactMarkdown>
            )}
            {finding.reference && (
              <div className="space-y-2 mt-4">
                <h4 className="text-xs font-medium text-muted-foreground uppercase">Reference</h4>
                <ReactMarkdown className="markdown">{finding.reference}</ReactMarkdown>
              </div>
            )}
            {!finding.explanation && !finding.reference && (
              <p className="text-sm text-muted-foreground">
                No description or reference available.
              </p>
            )}
          </div>
        )}
        {tab === "recommendation" && (
          <div className="p-4">
            {finding.recommendation ? (
              <ReactMarkdown className="markdown">{finding.recommendation}</ReactMarkdown>
            ) : (
              <p className="text-sm">No recommendation available.</p>
            )}
          </div>
        )}
        {tab === "feedback" && (
          <div className="p-4">
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
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default FindingDescription;
