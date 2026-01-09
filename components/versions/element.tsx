"use client";

import { codeActions } from "@/actions/bevor";
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
import { SourceTypeEnum } from "@/utils/enums";
import {
  commitUrl,
  explorerUrl,
  formatDate,
  formatDateShort,
  truncateId,
  truncateVersion,
} from "@/utils/helpers";
import { CodeMappingSchemaI, CodeVersionSchemaI } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUp,
  Clock,
  Code,
  ExternalLink,
  GitBranch,
  GitCommit,
  MessageSquare,
  MoreHorizontal,
  Network,
  RotateCw,
  Upload,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";

const formatSourceType = (sourceType: SourceTypeEnum): string => {
  switch (sourceType) {
    case SourceTypeEnum.SCAN:
      return "explorer";
    case SourceTypeEnum.PASTE:
    case SourceTypeEnum.UPLOAD_FILE:
    case SourceTypeEnum.UPLOAD_FOLDER:
      return "raw upload";
    case SourceTypeEnum.REPOSITORY:
      return "repo";
    default:
      return sourceType;
  }
};

const VersionDisplay: React.FC<{ version: CodeMappingSchemaI; showRepo?: boolean }> = ({
  version,
  showRepo = false,
}) => {
  if (
    [SourceTypeEnum.PASTE, SourceTypeEnum.UPLOAD_FILE, SourceTypeEnum.UPLOAD_FOLDER].includes(
      version.source_type,
    )
  ) {
    return <span className="text-xs text-muted-foreground">{truncateId(version.id)}</span>;
  }

  if (version.source_type === SourceTypeEnum.SCAN && version.network) {
    return (
      <div className="text-xs font-mono text-muted-foreground">
        <div className="flex gap-1 items-center">
          <Network className="size-3" />
          <span>{version.network}</span>
        </div>
        <span>{truncateVersion(version.version_identifier)}</span>
      </div>
    );
  }

  if (version.source_type === SourceTypeEnum.REPOSITORY && version.repository) {
    return (
      <div className="text-xs font-mono text-muted-foreground text-center">
        {showRepo && (
          <div className="flex items-center gap-1">
            <div className="relative size-4 shrink-0">
              <Image
                src={version.repository.account.avatar_url}
                alt={version.repository.account.login}
                fill
                className="rounded-full object-cover"
                unoptimized
              />
            </div>
            <span className="font-medium whitespace-nowrap">{version.repository.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-center">
          <span>{version?.branch}</span>
          <GitCommit className="size-3" />
          <span>{truncateId(version.version_identifier)}</span>
        </div>
      </div>
    );
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
          <span className="font-mono">{version.branch}</span>
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

export const CodeVersionCompactElement: React.FC<
  {
    version: CodeMappingSchemaI;
  } & React.ComponentProps<"div">
> = ({ version, className, ...props }) => {
  return (
    <div
      className={cn(
        "grid grid-cols-[24px_1fr_1fr_2fr_80px] items-center gap-3 py-3 px-3 border rounded-lg",
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
      <div className="flex flex-col shrink-0 justify-center">
        <span className="text-xs text-muted-foreground">
          {formatSourceType(version.source_type)}
        </span>
      </div>
      <div className="flex flex-col shrink-0 justify-center text-center">
        <VersionDisplay version={version} />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0 shrink-0 whitespace-nowrap justify-center text-center">
        <span>{formatDate(version.created_at)}</span>
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
    mutationFn: async () =>
      codeActions.retryEmbedding(teamSlug, version.id).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
    onError: () => {
      toast.error("Failed to retry processing");
    },
  });

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
        {(version.status === "failed_parsing" || version.status === "failed_embedding") && (
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
        {version.parent_id && (
          <DropdownMenuItem asChild>
            <Link
              href={`/team/${teamSlug}/${version.project_slug}/codes/${version.parent_id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowUp className="size-4" />
              View parent
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link
            href={{
              pathname: `/team/${teamSlug}/${version.project_slug}/codes/new`,
              query: { parentId: version.id },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Upload className="size-4" />
            Upload newer version
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={`/team/${teamSlug}/${version.project_slug}/codes/${version.id}/chat`}
            onClick={(e) => e.stopPropagation()}
          >
            <MessageSquare className="size-4" />
            Chat
          </Link>
        </DropdownMenuItem>
        {version.network && (
          <DropdownMenuItem asChild>
            <a href={explorerUrl(version.network, version.version_identifier)} target="_blank">
              <ExternalLink />
              View On Explorer
            </a>
          </DropdownMenuItem>
        )}
        {version.repository && (
          <DropdownMenuItem asChild>
            <a href={commitUrl(version)} target="_blank">
              <ExternalLink />
              View Commit
            </a>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getStatusIndicator = (status: CodeVersionSchemaI["status"]): React.ReactNode => {
  let statusText: string;
  let circleColor: string;

  switch (status) {
    case "waiting":
      statusText = "Processing";
      circleColor = "bg-neutral-400 animate-pulse";
      break;
    case "parsing":
      statusText = "Processing";
      circleColor = "bg-neutral-400 animate-pulse";
      break;
    case "embedding":
    case "parsed":
      statusText = "Post-Processing";
      circleColor = "bg-blue-400 animate-pulse";
      break;
    case "failed_parsing":
    case "failed_embedding":
      statusText = "Failed";
      circleColor = "bg-destructive";
      break;
    case "success":
      statusText = "Processed";
      circleColor = "bg-green-500";
      break;
  }

  return (
    <div className="flex items-center gap-2">
      <div className={cn("size-2 rounded-full shrink-0", circleColor)} />
      <span className="text-xs text-muted-foreground">{statusText}</span>
    </div>
  );
};

export const CodeVersionElementBare: React.FC<
  {
    version: CodeMappingSchemaI;
    teamSlug: string;
    showRepo?: boolean;
    showActions?: boolean;
  } & React.ComponentProps<"div">
> = ({ version, teamSlug, showRepo = false, showActions = true, className, ...props }) => {
  const hasParent = !!version.parent_id;

  return (
    <div
      className={cn(
        showActions
          ? "grid-cols-[24px_1fr_1fr_1fr_2fr_24px_1fr_40px]"
          : "grid-cols-[24px_1fr_1fr_1fr_2fr_24px_1fr]",

        "grid items-center gap-3 py-3 px-3 border rounded-lg",
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
      <div className="flex flex-col shrink-0 justify-center text-center">
        {getStatusIndicator(version.status)}
      </div>
      <div className="flex flex-col shrink-0 justify-center text-center">
        <span className="text-xs text-muted-foreground">
          {formatSourceType(version.source_type)}
        </span>
      </div>
      <div className="flex flex-col shrink-0 justify-center">
        <VersionDisplay version={version} showRepo={showRepo} />
      </div>

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
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0 shrink-0 whitespace-nowrap justify-center text-center">
        <span>{formatDateShort(version.created_at)}</span>
        <span>by</span>
        <Icon size="sm" seed={version.user.id} className="shrink-0" />
        <span className="truncate">{version.user.username}</span>
      </div>

      {showActions && (
        <div className="flex items-center justify-center">
          <CodeVersionActions version={version} teamSlug={teamSlug} />
        </div>
      )}
    </div>
  );
};

export const CodeVersionElement: React.FC<{
  version: CodeMappingSchemaI;
  teamSlug: string;
  isDisabled?: boolean;
  showRepo?: boolean;
  showActions?: boolean;
}> = ({ version, teamSlug, isDisabled = false, showRepo, showActions }) => {
  return (
    <Link
      href={`/team/${teamSlug}/${version.project_slug}/codes/${version.id}`}
      className={cn(
        "block transition-colors",
        isDisabled ? "cursor-default opacity-50" : "hover:bg-accent/50 cursor-pointer",
      )}
      aria-disabled={isDisabled}
    >
      <CodeVersionElementBare
        version={version}
        teamSlug={teamSlug}
        showRepo={showRepo}
        showActions={showActions}
      />
    </Link>
  );
};
