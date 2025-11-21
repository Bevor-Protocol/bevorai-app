"use client";

import NodeSearch from "@/app/(core)/teams/[teamSlug]/projects/[projectSlug]/codes/[codeId]/search";
import { formatDate, truncateVersion } from "@/utils/helpers";
import { DefaultAnalysisThreadsQuery } from "@/utils/query-params";
import { CodeMappingSchemaI } from "@/utils/types";
import { Calendar, ExternalLink, Network } from "lucide-react";
import CodeVersionMenu from "./code-version-menu";
import Relations from "./relations";

const CodeMetadata: React.FC<{
  teamSlug: string;
  projectSlug: string;
  version: CodeMappingSchemaI;
  analysisQuery: typeof DefaultAnalysisThreadsQuery;
}> = ({ teamSlug, projectSlug, version, analysisQuery }) => {
  return (
    <div className="grid pb-4 lg:pt-4 px-4" style={{ gridTemplateColumns: "250px 1fr" }}>
      <h3>{version.inferred_name}</h3>
      <div className="flex justify-between gap-10">
        <NodeSearch
          teamSlug={teamSlug}
          codeId={version.id}
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

          <Relations version={version} teamSlug={teamSlug} />
          <CodeVersionMenu
            version={version}
            teamSlug={teamSlug}
            projectSlug={projectSlug}
            analysisQuery={analysisQuery}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeMetadata;
