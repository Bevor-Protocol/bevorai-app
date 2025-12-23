"use client";

import { analysisActions } from "@/actions/bevor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

const FindingDescription: React.FC<{
  teamSlug: string;
  nodeId: string;
  finding: FindingSchemaI;
  setSelectedFinding: React.Dispatch<React.SetStateAction<FindingSchemaI | undefined>>;
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
    <div className={cn("border rounded-lg overflow-hidden", "finding")}>
      <div className="flex justify-between items-center">
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
        <Badge variant="outline" size="sm" className="mr-2">
          {truncateId(finding.id)}
        </Badge>
      </div>
      {tab === "description" && (
        <div className="space-y-4 p-4">
          {finding.explanation && <p className="text-sm leading-relaxed">{finding.explanation}</p>}
          {finding.reference && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase">Reference</h4>
              <p className="text-sm leading-relaxed">{finding.reference}</p>
            </div>
          )}
          {!finding.explanation && !finding.reference && (
            <p className="text-sm text-muted-foreground">No description or reference available.</p>
          )}
        </div>
      )}
      {tab === "recommendation" && (
        <div className="space-y-2 px-4 py-2">
          {finding.recommendation ? (
            <p className="text-sm leading-relaxed">{finding.recommendation}</p>
          ) : (
            <p className="text-sm">No recommendation available.</p>
          )}
        </div>
      )}
      {tab === "feedback" && (
        <div className="space-y-4 px-4 py-2">
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

export default FindingDescription;
