import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, truncateVersion } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { CodeVersionSchema } from "@/utils/types";
import { Clock, Code, Network } from "lucide-react";
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

const VersionBadge: React.FC<{
  version: CodeVersionSchema;
  isPreview: boolean;
}> = ({ version, isPreview }) => {
  if (!version.solc_version || isPreview) return null;

  return (
    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-900/20 text-blue-400 border border-blue-800/30">
      Solidity {version.solc_version}
    </span>
  );
};

const VersionMeta: React.FC<{
  version: CodeVersionSchema;
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

export const CodeVersionElement: React.FC<{
  version: CodeVersionSchema;
  teamSlug: string;
  isPreview?: boolean;
}> = ({ version, teamSlug, isPreview = false }) => {
  const versionDisplay = truncateVersion({
    versionMethod: version.version_method,
    versionIdentifier: version.version_identifier,
  });

  return (
    <Link
      href={navigation.version.overview({
        teamSlug,
        projectSlug: version.project_slug,
        versionId: version.id,
      })}
      className="block border border-border hover:border-border-accent transition-all rounded-md p-4"
    >
      <div className="flex items-start justify-start">
        <div>
          <Code className="size-4 text-green-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Code className="size-4 text-green-500 flex-shrink-0" />
            <h3 className="font-medium text-foreground truncate">
              {version.version_method} - {versionDisplay}
            </h3>
            <VersionBadge version={version} isPreview={isPreview} />
          </div>
          <VersionMeta version={version} />
        </div>
      </div>
    </Link>
  );
};
