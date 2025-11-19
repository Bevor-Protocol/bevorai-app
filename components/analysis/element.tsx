import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { AnalysisSchemaI, AnalysisVersionMappingSchemaI } from "@/utils/types";
import { Clock, Lock, Shield, Unlock, User } from "lucide-react";
import Link from "next/link";
import React from "react";

type AnalysisElementProps = {
  analysis: AnalysisSchemaI & { n: number };
  teamSlug: string;
  isDisabled?: boolean;
  isPreview?: boolean;
};

export const AnalysisElementLoader: React.FC = () => {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="size-6 rounded-lg" />
            <div className="flex items-center space-x-3">
              <Skeleton className="w-24 h-4" />
              <div className="flex items-center space-x-1">
                <Skeleton className="w-3 h-3" />
                <Skeleton className="w-20 h-3" />
              </div>
            </div>
          </div>
          <Skeleton className="size-4" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-8 h-3" />
            <Skeleton className="w-8 h-3" />
            <Skeleton className="w-8 h-3" />
            <Skeleton className="w-8 h-3" />
          </div>
          <Skeleton className="w-24 h-3" />
        </div>
      </div>
    </div>
  );
};

export const AnalysisVersionElementCompact: React.FC<
  {
    analysisVersion: AnalysisVersionMappingSchemaI;
  } & React.ComponentProps<"div">
> = ({ analysisVersion, className, ...props }) => {
  return (
    <div className={cn("flex items-center gap-2 py-2 px-3", className)} {...props}>
      <Shield className="size-3.5 text-purple-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm font-mono">
            v{analysisVersion.id.slice(0, 6)}...{analysisVersion.id.slice(-4)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>{analysisVersion.version.n_scopes} scopes</span>
          <span>•</span>
          <span>{analysisVersion.version.n_findings} findings</span>
        </div>
      </div>
    </div>
  );
};

export const AnalysisVersionElementBare: React.FC<
  {
    analysisVersion: AnalysisVersionMappingSchemaI;
    isPreview?: boolean;
  } & React.ComponentProps<"div">
> = ({ analysisVersion, className, ...props }) => {
  return (
    <div
      className={cn("flex items-start justify-start gap-2 rounded-lg p-4", className)}
      {...props}
    >
      <Shield className="size-4 text-purple-foreground mt-1.5" />
      <div className="grow space-y-2">
        <div className="flex justify-between">
          <p className="font-medium text-foreground truncate text-lg">
            v{analysisVersion.id.slice(0, 5) + "..." + analysisVersion.id.slice(-5)}
          </p>
        </div>
        <div className="flex justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{analysisVersion.version.n_scopes} scopes</span>
            <span>{analysisVersion.version.n_findings} findings</span>
            <div className="flex items-center gap-1">
              <Clock className="size-3" />
              <span>{formatDate(analysisVersion.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AnalysisVersionElement: React.FC<{
  teamSlug: string;
  analysisVersion: AnalysisVersionMappingSchemaI;
  isDisabled?: boolean;
}> = ({ teamSlug, analysisVersion, isDisabled = false }) => {
  return (
    <Link
      href={navigation.analysisVersions.overview({
        teamSlug,
        analysisVersionId: analysisVersion.id,
      })}
      aria-disabled={isDisabled}
      className={cn(
        "block border transition-colors rounded-lg",
        isDisabled ? "cursor-default" : "hover:border-muted-foreground/60 cursor-pointer",
      )}
    >
      <AnalysisVersionElementBare analysisVersion={analysisVersion} />
    </Link>
  );
};

export const AnalysisElementBare: React.FC<
  {
    analysis: AnalysisSchemaI;
  } & React.ComponentProps<"div">
> = ({ analysis, className, ...props }) => {
  return (
    <div
      className={cn("flex items-start justify-start gap-2 rounded-lg p-4", className)}
      {...props}
    >
      <div className="grow space-y-2">
        <div className="flex justify-between">
          <p className="font-medium text-foreground truncate max-w-1/2">{analysis.name}</p>
          <div className="size-4">
            {analysis.is_public ? (
              <Unlock className="size-3 text-green-500" />
            ) : (
              <Lock className="size-3 text-purple-400" />
            )}
          </div>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            <span>{formatDate(analysis.created_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="size-3" />
            <span>{analysis.user.username}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AnalysisElement: React.FC<AnalysisElementProps> = ({
  analysis,
  teamSlug,
  isDisabled = false,
}) => {
  return (
    <Link
      href={navigation.analysis.overview({
        teamSlug,
        projectSlug: analysis.project_id,
        analysisId: analysis.id,
      })}
      aria-disabled={isDisabled}
      className={cn(
        "block border transition-colors rounded-lg",
        isDisabled ? "cursor-default" : "hover:border-muted-foreground/60 cursor-pointer",
      )}
    >
      <AnalysisElementBare analysis={analysis} />
    </Link>
  );
};
