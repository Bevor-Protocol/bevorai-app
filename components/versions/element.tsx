import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, truncateVersion } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { CodeVersionSchema } from "@/utils/types";
import { Clock, Code, ExternalLink, Network, Shield } from "lucide-react";
import Link from "next/link";
import React from "react";

export const CodeVersionElementLoader: React.FC = () => {
  return (
    <div className="border border-neutral-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <Skeleton className="w-48 h-5" />
            </div>
            <div className="flex items-center space-x-4 text-xs text-neutral-400">
              <div className="flex items-center space-x-1">
                <Skeleton className="w-3 h-3" />
                <Skeleton className="w-20 h-3" />
              </div>
              <div className="flex items-center space-x-1">
                <Skeleton className="w-3 h-3" />
                <Skeleton className="w-16 h-3" />
              </div>
              <Skeleton className="w-24 h-4 rounded" />
              <Skeleton className="w-16 h-3" />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-16 h-7 rounded" />
        </div>
      </div>
    </div>
  );
};

export const CodeVersionElement: React.FC<{
  version: CodeVersionSchema;
  teamSlug: string;
  isPreview?: boolean;
}> = ({ version, teamSlug, isPreview = false }) => {
  return (
    <div className="border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-all">
      <div className="flex items-center justify-between">
        <Link
          href={`/teams/${teamSlug}/projects/${version.project_slug}/versions/${version.id}`}
          className="flex items-center space-x-3 flex-1"
        >
          <div className="space-y-1">
            <div className="flex flex-row gap-3 items-center">
              <Code className="size-4 text-green-400" />
              <div className="text-base font-medium text-neutral-100 flex flex-row gap-4 ">
                <p>
                  {version.version_method} -{" "}
                  {truncateVersion({
                    versionMethod: version.version_method,
                    versionIdentifier: version.version_identifier,
                  })}
                </p>
                <div className="flex items-center space-x-1 text-xs text-neutral-500">
                  <Clock className="size-3" />
                  <span>{formatDate(version.created_at)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-xs text-neutral-400 pl-7">
              {version.solc_version && !isPreview && (
                <span className="text-xs bg-neutral-800 px-2 py-0.5 rounded">
                  Solidity {version.solc_version}
                </span>
              )}
              {version.network && (
                <div className="flex items-center space-x-1">
                  <Network className="size-3 text-neutral-400" />
                  <span>{version.network}</span>
                </div>
              )}
              <span className="text-xs text-neutral-500">{version.source_type}</span>
            </div>
          </div>
        </Link>
        <div className="flex items-center space-x-2 ml-4">
          {version.source_url && <ExternalLink className="w-4 h-4 text-neutral-500" />}
          <div className="relative">
            <Link
              href={navigation.version.audits.new({
                teamSlug,
                projectSlug: version.project_slug,
                versionId: version.id,
              })}
              className="inline-block"
            >
              <Button size="sm" variant="secondary">
                <Shield className="size-3 text-sm" />
                <span className="text-xs">Audit</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
