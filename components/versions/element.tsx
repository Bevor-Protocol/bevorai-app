import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate, trimAddress } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { CodeVersionMappingSchemaI, CodeVersionSchemaI, SourceTypeEnum } from "@/utils/types";
import { Clock, Code, ExternalLink, Network } from "lucide-react";
import Link from "next/link";
import React from "react";

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
      <span className="capitalize">{version.source_type}</span>
      <div className="flex items-center gap-1">
        <Clock className="size-3" />
        <span>{formatDate(version.created_at)}</span>
      </div>
    </div>
  );
};

export const CodeVersionElementBare: React.FC<
  {
    version: CodeVersionMappingSchemaI;
  } & React.ComponentProps<"div">
> = ({ version, className, ...props }) => {
  const isScanMethod = version.version.source_type === SourceTypeEnum.SCAN;
  const isRepoMethod = version.version.source_type === SourceTypeEnum.REPOSITORY;

  const formatVersionIdentifier = (): string => {
    if (version.version.version_method === "tag") {
      return version.version.version_identifier;
    }
    if (version.version.version_method === "address") {
      return trimAddress(version.version.version_identifier);
    }
    return version.version.version_identifier.slice(0, 7) + "...";
  };

  return (
    <div
      className={cn("flex items-start justify-start gap-2 rounded-lg p-4", className)}
      {...props}
    >
      <Code className="size-4 text-green-foreground mt-1.5" />
      <div className="grow space-y-2">
        <div className="flex justify-between">
          <p className="font-medium text-foreground truncate text-lg">{version.inferred_name}</p>
        </div>
        <div className="flex justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {isScanMethod && version.version.network && (
              <div className="flex items-center gap-1">
                <Network className="size-3" />
                <span>{version.version.network}</span>
              </div>
            )}
            <span className="capitalize">{version.version.source_type}</span>
            <Badge variant="outline" size="sm" className="font-mono text-xs">
              {formatVersionIdentifier()}
            </Badge>
            {version.version.solc_version && (
              <span className="font-mono text-xs">{version.version.solc_version}</span>
            )}
            {isRepoMethod && version.version.source_url && (
              <a
                href={version.version.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="size-3" />
                <span>Source</span>
              </a>
            )}
            <div className="flex items-center gap-1">
              <Clock className="size-3" />
              <span>{formatDate(version.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CodeVersionElement: React.FC<{
  version: CodeVersionMappingSchemaI;
  teamId: string;
  isDisabled?: boolean;
}> = ({ version, teamId, isDisabled = false }) => {
  return (
    <Link
      href={navigation.code.overview({
        teamId,
        versionId: version.id,
      })}
      className={cn(
        "block border transition-colors rounded-lg",
        isDisabled ? "cursor-default" : "hover:border-muted-foreground/60 cursor-pointer",
      )}
      aria-disabled={isDisabled}
    >
      <CodeVersionElementBare version={version} />
    </Link>
  );
};
