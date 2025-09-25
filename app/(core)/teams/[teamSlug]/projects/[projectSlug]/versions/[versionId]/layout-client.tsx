"use client";

import { Button } from "@/components/ui/button";
import { formatDate, truncateVersion } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { CodeVersionSchema } from "@/utils/types";
import { Calendar, ExternalLink, Network, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const VersionLayoutClient: React.FC<{
  version: CodeVersionSchema;
  slugs: {
    teamSlug: string;
    projectSlug: string;
    versionId: string;
  };
}> = ({ version, slugs }) => {
  const pathname = usePathname();

  if (pathname.endsWith("/audits/new")) {
    return <></>;
  }

  return (
    <div className="flex flex-row justify-between mb-8 border-b border-b-neutral-800 py-4">
      <div>
        <h1>
          Version{" - "}
          {truncateVersion({
            versionMethod: version.version_identifier,
            versionIdentifier: version.version_identifier,
          })}
        </h1>
        <div className="flex items-center space-x-4 text-sm text-neutral-400 mt-2">
          <div className="flex items-center space-x-1">
            <Calendar className="size-4" />
            <span>Created {formatDate(version.created_at)}</span>
          </div>
          {version.network && (
            <div className="flex items-center space-x-1">
              <Network className="size-4" />
              <span>{version.network}</span>
            </div>
          )}
          {version.solc_version && (
            <div className="flex items-center space-x-1">
              <span className="text-xs bg-neutral-800 px-2 py-1 rounded">
                Solidity {version.solc_version}
              </span>
            </div>
          )}
          {version.source_url && (
            <div>
              <span className="text-neutral-400">Source URL:</span>
              <span className="ml-2 text-blue-400 flex items-center space-x-1">
                <span>View Source</span>
                <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <span>Method: {version.source_type}</span>
          </div>
        </div>
      </div>
      <Link href={navigation.version.audits.new(slugs)}>
        <Button className="flex items-center space-x-2">
          <Plus className="size-4" />
          <span>New Audit</span>
        </Button>
      </Link>
    </div>
  );
};

export default VersionLayoutClient;
