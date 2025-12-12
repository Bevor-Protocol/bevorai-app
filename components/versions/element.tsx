"use client";

import { codeActions } from "@/actions/bevor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate, trimAddress } from "@/utils/helpers";
import { CodeMappingSchemaI, CodeVersionSchemaI, SourceTypeEnum } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUp,
  Clock,
  Code,
  GitBranch,
  GitCommit,
  MessageSquare,
  MoreHorizontal,
  Network,
  RotateCw,
  Upload,
  User,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";

const formatSourceType = (sourceType: SourceTypeEnum): string => {
  switch (sourceType) {
    case SourceTypeEnum.SCAN:
      return "explorer";
    case SourceTypeEnum.PASTE:
      return "paste";
    case SourceTypeEnum.UPLOAD_FILE:
      return "file";
    case SourceTypeEnum.UPLOAD_FOLDER:
      return "folder";
    case SourceTypeEnum.REPOSITORY:
      return "repo";
    default:
      return sourceType;
  }
};

export const CodeVersionElementLoader: React.FC = () => {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="size-4" />
            <Skeleton className="w-48 h-5" />
            <Skeleton className="w-20 h-5 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Skeleton className="w-3 h-3" />
              <Skeleton className="w-16 h-3" />
            </div>
            <Skeleton className="w-12 h-3" />
            <div className="flex items-center gap-1">
              <Skeleton className="w-3 h-3" />
              <Skeleton className="w-20 h-3" />
            </div>
          </div>
        </div>
        <Skeleton className="size-4 ml-2" />
      </div>
    </div>
  );
};

export const VersionMeta: React.FC<{
  version: CodeVersionSchemaI;
}> = ({ version }) => {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      {version.network && (
        <div className="flex items-center gap-1">
          <Network className="size-3" />
          <span>{version.network}</span>
        </div>
      )}
      {!!version.commit && version.version_method === "commit" && (
        <div className="flex items-center gap-1">
          <GitBranch className="size-3" />
          <span className="font-mono">{version.commit.branch}</span>
        </div>
      )}
      {version.version_method === "hash" && (
        <div className="flex items-center gap-1">
          <GitCommit className="size-3" />
          <span className="font-mono">{version.version_identifier.slice(0, 7)}</span>
        </div>
      )}
      {version.commit && (
        <div className="flex items-center gap-1">
          <User className="size-3" />
          <span>{version.commit.author}</span>
        </div>
      )}
      <span>{formatSourceType(version.source_type)}</span>
      <div className="flex items-center gap-1">
        <Clock className="size-3" />
        <span>{formatDate(version.commit?.timestamp || version.created_at)}</span>
      </div>
    </div>
  );
};

export const CodeVersionElementCompact: React.FC<
  {
    version: CodeMappingSchemaI;
  } & React.ComponentProps<"div">
> = ({ version, className, ...props }) => {
  const isScanMethod = version.version.source_type === SourceTypeEnum.SCAN;

  const formatVersionIdentifier = (): string => {
    if (version.version.version_method === "tag") {
      return version.version.version_identifier.length > 20
        ? version.version.version_identifier.slice(0, 20) + "..."
        : version.version.version_identifier;
    }
    if (version.version.version_method === "address") {
      return trimAddress(version.version.version_identifier);
    }
    if (version.version.version_method === "commit" || version.version.version_method === "hash") {
      return version.version.version_identifier.slice(0, 7);
    }
    return version.version.version_identifier.slice(0, 7) + "...";
  };

  return (
    <div className={cn("flex items-center gap-2 py-2 px-3", className)} {...props}>
      <Code className="size-3.5 text-green-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{version.inferred_name}</p>
          {isScanMethod && version.version.network && (
            <Badge variant="outline" size="sm" className="shrink-0 text-xs">
              {version.version.network}
            </Badge>
          )}
          {!!version.version.commit && (
            <div className="flex items-center gap-1 shrink-0">
              <GitBranch className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-mono">
                {version.version.commit.branch}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 shrink-0">
            {(version.version.version_method === "commit" ||
              version.version.version_method === "hash") && (
              <GitCommit className="size-3 text-muted-foreground" />
            )}
            <Badge variant="outline" size="sm" className="font-mono text-xs">
              {formatVersionIdentifier()}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>{formatSourceType(version.version.source_type)}</span>
          {version.version.commit && (
            <>
              <span>•</span>
              <span className="truncate max-w-[200px]" title={version.version.commit.message}>
                {version.version.commit.message}
              </span>
            </>
          )}
          {version.version.solc_version && (
            <>
              <span>•</span>
              <span className="font-mono">{version.version.solc_version}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const CodeVersionActions: React.FC<{
  version: CodeMappingSchemaI;
  teamSlug: string;
}> = ({ version, teamSlug }) => {
  const queryClient = useQueryClient();

  const retryMutation = useMutation({
    mutationFn: async () => codeActions.retryEmbedding(teamSlug, version.id),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
    onError: () => {
      toast.error("Failed to retry processing");
    },
  });

  const chatPath = `/${teamSlug}/${version.project_slug}/codes/${version.id}/chat`;
  const uploadNewerPath = `/${teamSlug}/${version.project_slug}/codes/new?parentId=${version.id}`;
  const parentPath = version.parent_id
    ? `/${teamSlug}/${version.project_slug}/codes/${version.parent_id}`
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <MoreHorizontal className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {(version.version.status === "failed_parsing" ||
          version.version.status === "failed_embedding") && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              retryMutation.mutate();
            }}
            disabled={retryMutation.isPending}
          >
            <RotateCw className="size-4" />
            Retry
          </DropdownMenuItem>
        )}
        {parentPath && (
          <DropdownMenuItem asChild>
            <Link href={parentPath} onClick={(e) => e.stopPropagation()}>
              <ArrowUp className="size-4" />
              View parent
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href={uploadNewerPath} onClick={(e) => e.stopPropagation()}>
            <Upload className="size-4" />
            Upload newer version
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={chatPath} onClick={(e) => e.stopPropagation()}>
            <MessageSquare className="size-4" />
            Chat
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const CodeVersionElementBare: React.FC<
  {
    version: CodeMappingSchemaI;
    teamSlug: string;
  } & React.ComponentProps<"div">
> = ({ version, teamSlug, className, ...props }) => {
  const formatVersionIdentifier = (): string => {
    if (version.version.version_method === "tag") {
      return version.version.version_identifier;
    }
    if (version.version.version_method === "address") {
      return trimAddress(version.version.version_identifier);
    }
    if (version.version.version_method === "commit" || version.version.version_method === "hash") {
      return version.version.version_identifier.slice(0, 7);
    }
    return version.version.version_identifier.slice(0, 7);
  };

  const formatDateShort = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getStatusIndicator = (): React.ReactNode => {
    let statusText: string;
    let circleColor: string;

    switch (version.version.status) {
      case "success":
        statusText = "Processed";
        circleColor = "bg-green-500";
        break;
      case "embedding":
      case "parsing":
        statusText = "Processing";
        circleColor = "bg-muted";
        break;
      case "failed_parsing":
      case "failed_embedding":
        statusText = "Failed";
        circleColor = "bg-red-500";
        break;
      case "waiting":
      case "parsed":
      default:
        statusText = "Processing";
        circleColor = "bg-muted";
        break;
    }

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className={cn("size-2 rounded-full shrink-0", circleColor)} />
          <span className="text-xs text-foreground">{statusText}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatSourceType(version.version.source_type)}
        </span>
      </div>
    );
  };

  const hasParent = !!version.parent_id;

  return (
    <div
      className={cn(
        "grid grid-cols-[24px_minmax(0,200px)_minmax(100px,auto)_minmax(0,300px)_24px_auto_40px] items-center gap-3 py-3 px-3 border rounded-lg",
        className,
      )}
      {...props}
    >
      <div className="flex justify-center">
        <Code className="size-4 text-green-400" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-medium truncate">{version.inferred_name}</h3>
      </div>
      <div className="flex flex-col shrink-0 justify-center">{getStatusIndicator()}</div>
      {(version.version.version_method === "commit" || version.version.version_method === "hash") &&
      version.version.source_type === SourceTypeEnum.REPOSITORY ? (
        <div className="flex flex-col gap-1 shrink-0 min-w-0 justify-center">
          {version.version.commit && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
              <GitBranch className="size-3 shrink-0" />
              <span className="font-mono truncate min-w-0">{version.version.commit.branch}</span>
            </div>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <GitCommit className="size-3 text-muted-foreground shrink-0" />
            <span className="font-mono text-xs text-muted-foreground shrink-0">
              {formatVersionIdentifier()}
            </span>
            {version.version.commit && (
              <span
                className="text-xs text-muted-foreground truncate min-w-0"
                title={version.version.commit.message}
              >
                {version.version.commit.message}
              </span>
            )}
          </div>
        </div>
      ) : version.version.source_type === SourceTypeEnum.SCAN ? (
        <div className="flex flex-col gap-1 shrink-0 min-w-0 justify-center">
          {version.version.network && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Network className="size-3" />
              <span>{version.version.network}</span>
            </div>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <Code className="size-3 text-muted-foreground shrink-0" />
            <span className="font-mono text-xs text-muted-foreground">
              {version.version.version_identifier}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <span className="font-mono text-xs text-muted-foreground">
            {formatVersionIdentifier()}
          </span>
        </div>
      )}
      <div className="flex items-center justify-center shrink-0">
        {hasParent && (
          <div
            className="flex items-center gap-1 text-xs text-muted-foreground"
            title="Has parent version"
          >
            <GitBranch className="size-3" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0 shrink-0 whitespace-nowrap">
        <span>{formatDateShort(version.created_at)}</span>
        <span>by</span>
        <Icon size="sm" seed={version.user.id} className="shrink-0" />
        <span className="truncate">{version.user.username}</span>
      </div>

      <div className="flex items-center justify-center">
        <CodeVersionActions version={version} teamSlug={teamSlug} />
      </div>
    </div>
  );
};

export const CodeVersionElement: React.FC<{
  version: CodeMappingSchemaI;
  teamSlug: string;
  isDisabled?: boolean;
}> = ({ version, teamSlug, isDisabled = false }) => {
  console.log(version);
  return (
    <Link
      href={`/${teamSlug}/${version.project_slug}/codes/${version.id}`}
      className={cn(
        "block transition-colors",
        isDisabled ? "cursor-default opacity-50" : "hover:bg-accent/50 cursor-pointer",
      )}
      aria-disabled={isDisabled}
    >
      <CodeVersionElementBare version={version} teamSlug={teamSlug} />
    </Link>
  );
};
