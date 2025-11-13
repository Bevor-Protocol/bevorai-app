import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate, truncateVersion } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { CodeVersionMappingSchemaI, CodeVersionSchemaI } from "@/utils/types";
import { Clock, Code, Network, User } from "lucide-react";
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

export const VersionBadge: React.FC<{
  name: string;
  isPreview?: boolean;
}> = ({ name, isPreview = false }) => {
  if (isPreview) return null;

  return (
    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-900/20 text-blue-400 border border-blue-800/30">
      {name}
    </span>
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
    isPreview?: boolean;
  } & React.ComponentProps<"div">
> = ({ version, isPreview = false, className, ...props }) => {
  const versionDisplay = truncateVersion({
    versionMethod: version.version.version_method,
    versionIdentifier: version.version.version_identifier,
  });

  return (
    <div
      className={cn("flex items-start justify-start gap-2 rounded-lg p-4", className)}
      {...props}
    >
      <Code className="size-4 text-green-foreground mt-2" />
      <div className="grow space-y-2">
        <div className="flex justify-between">
          <p className="font-medium text-foreground truncate text-lg">
            {version.version.version_method} - {versionDisplay}
          </p>
          <VersionBadge name={version.name} isPreview={isPreview} />
        </div>
        <div className="flex justify-between">
          <VersionMeta version={version.version} />
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <User className="size-3" />
            <span>{version.user.username}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CodeVersionElement: React.FC<{
  version: CodeVersionMappingSchemaI;
  teamId: string;
  isPreview?: boolean;
  isDisabled?: boolean;
}> = ({ version, teamId, isPreview = false, isDisabled = false }) => {
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
      <CodeVersionElementBare version={version} isPreview={isPreview} />
    </Link>
  );
};
