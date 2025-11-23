"use client";

import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useSSE } from "@/hooks/useSSE";
import { ProjectDetailedSchemaI } from "@/utils/types";
import { Check, CheckCircle, Circle, Loader2, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface CodeProcessingStatusProps {
  mutationStatus: "pending" | "error" | "idle" | "success";
  codeVersionId?: string;
  project: ProjectDetailedSchemaI;
}

const StatusIndicator: React.FC<{
  status: "idle" | "success" | "error" | "pending";
  label: string;
}> = ({ status, label }) => {
  const getIcon = (): React.ReactNode => {
    switch (status) {
      case "pending":
        return <Loader className="size-4" />;
      case "success":
        return <Check className="size-4 text-green-500" />;
      case "error":
        return <X className="size-4 text-red-500" />;
      default:
        return <Circle className="size-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-4 flex items-center justify-center">{getIcon()}</div>
      <span>{label}</span>
    </div>
  );
};

export const CodeProcessingStatus: React.FC<CodeProcessingStatusProps> = ({
  mutationStatus,
  codeVersionId,
  project,
}) => {
  const [postProcessingStatus, setPostProcessingStatus] = useState<
    "idle" | "success" | "error" | "pending"
  >("idle");

  const { connect } = useSSE({
    autoConnect: false,
    eventTypes: ["code_versions"],
    onMessage: (message) => {
      let parsed: string;
      try {
        parsed = JSON.parse(message.data);
      } catch {
        parsed = message.data;
      }

      if (parsed === "pending" || parsed === "embedding") {
        setPostProcessingStatus("pending");
      } else if (parsed === "embedded") {
        setPostProcessingStatus("success");
      } else if (parsed === "failed") {
        setPostProcessingStatus("error");
      }
    },
  });

  useEffect(() => {
    if (!codeVersionId) return;
    connect(`/code-versions/${codeVersionId}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeVersionId]);

  const isFullySuccessful = mutationStatus === "success" && postProcessingStatus === "success";
  const hasError = mutationStatus === "error" || postProcessingStatus === "error";
  const isLoading = mutationStatus === "pending" || postProcessingStatus === "pending";

  const getGlobalStatus = (): "idle" | "success" | "error" | "pending" => {
    if (hasError) return "error";
    if (isFullySuccessful) return "success";
    if (isLoading) return "pending";
    return "idle";
  };

  const globalStatus = getGlobalStatus();

  const getGlobalIcon = (): React.ReactNode => {
    switch (globalStatus) {
      case "pending":
        return <Loader2 className="size-8 text-blue-400 animate-spin" />;
      case "success":
        return <CheckCircle className="size-8 text-green-400" />;
      case "error":
        return <X className="size-8 text-destructive" />;
      default:
        return <Circle className="size-8 text-muted-foreground" />;
    }
  };

  const getGlobalBgColor = (): string => {
    switch (globalStatus) {
      case "pending":
        return "bg-blue-500/10";
      case "success":
        return "bg-green-500/10";
      case "error":
        return "bg-red-500/10";
      default:
        return "bg-muted/10";
    }
  };

  const getGlobalTitle = (): string => {
    switch (globalStatus) {
      case "pending":
        return "Processing Code...";
      case "success":
        return "Version Created Successfully!";
      case "error":
        return "Processing Failed";
      default:
        return "Processing";
    }
  };

  return (
    <div className="flex flex-col max-w-2xl mx-auto gap-8 text-center">
      <div>
        <div
          className={`w-16 h-16 rounded-full ${getGlobalBgColor()} flex items-center justify-center mx-auto`}
        >
          {getGlobalIcon()}
        </div>
        <h2 className="text-2xl font-bold">{getGlobalTitle()}</h2>
      </div>
      <div className="flex flex-col gap-2 items-start pt-2 text-left m-auto w-fit">
        <StatusIndicator status={mutationStatus} label="Preparing" />
        <StatusIndicator status={postProcessingStatus} label="Post-processing" />
      </div>
      {isFullySuccessful && codeVersionId && (
        <Button asChild className="w-[200px] m-auto">
          <Link
            href={`/teams/${project.team.slug}/projects/${project.slug}/codes/${codeVersionId}`}
          >
            View Version
          </Link>
        </Button>
      )}
    </div>
  );
};
