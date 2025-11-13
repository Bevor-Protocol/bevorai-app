"use client";

import NodeSearch from "@/app/(core)/teams/[teamId]/codes/[versionId]/search";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCode } from "@/providers/code";
import { formatDate, truncateVersion } from "@/utils/helpers";
import { CodeSourceSchemaI, CodeVersionMappingSchemaI } from "@/utils/types";
import { Calendar, ExternalLink, Network } from "lucide-react";
import Relations from "./relations";
import SourcesViewer from "./sources-viewer";

const CodeClient: React.FC<{
  teamId: string;
  sources: CodeSourceSchemaI[];
  version: CodeVersionMappingSchemaI;
}> = ({ teamId, sources, version }) => {
  const { scrollRef } = useCode();

  return (
    <ScrollArea className="h-full" viewportRef={scrollRef}>
      <div className="grid pb-4 lg:pt-4 pr-2" style={{ gridTemplateColumns: "250px 1fr" }}>
        <h3>Code Version {version.name}</h3>
        <div className="flex justify-between gap-10">
          <NodeSearch
            teamId={teamId}
            versionId={version.id}
            className="flex-1 justify-start basis-1/2"
          />
          <div className="flex items-center justify-end w-full gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1 whitespace-nowrap">
              <span>Method: {version.version.source_type}</span>
            </div>
            {version.version.network && (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <Network className="size-4" />
                <span>{version.version.network}</span>
              </div>
            )}
            {version.version.solc_version && (
              <div className="flex items-center gap-1 whitespace-nowrap">
                {truncateVersion({
                  versionMethod: version.version.version_method,
                  versionIdentifier: version.version.version_identifier,
                })}
              </div>
            )}
            {version.version.source_url && (
              <div>
                <span className="text-muted-foreground">Source URL:</span>
                <span className="ml-2 text-blue-400 flex items-center gap-1">
                  <span>View Source</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Calendar className="size-4" />
              <span>{formatDate(version.created_at)}</span>
            </div>

            <Relations version={version} teamId={teamId} />
          </div>
        </div>
      </div>
      <SourcesViewer sources={sources} teamId={teamId} versionId={version.id} />
    </ScrollArea>
  );
};

export default CodeClient;
