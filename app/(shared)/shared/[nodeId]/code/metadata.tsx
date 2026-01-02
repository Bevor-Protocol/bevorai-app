"use client";

import { Button } from "@/components/ui/button";
import { SourceTypeEnum } from "@/utils/enums";
import { explorerUrl, formatDateShort, truncateId, truncateVersion } from "@/utils/helpers";
import { CodeMappingSchemaI, SharedCodeMappingSchemaI } from "@/utils/types";
import { GitCommit, Network, XCircle } from "lucide-react";

const getStatusIndicator = (status: CodeMappingSchemaI["status"]): React.ReactNode => {
  switch (status) {
    case "waiting":
      return (
        <div className="flex items-center gap-1">
          <div className="size-2 rounded-full bg-neutral-400 shrink-0 animate-pulse" />
          <span className="capitalize">Waiting</span>
        </div>
      );
    case "embedding":
    case "parsing":
    case "parsed":
      return (
        <div className="flex items-center gap-1">
          <div className="size-3 rounded-full bg-blue-400 shrink-0 animate-pulse" />
          <span className="capitalize">Post-Processing</span>
        </div>
      );
    case "failed_parsing":
    case "failed_embedding":
      return (
        <div className="flex items-center gap-1">
          <XCircle className="size-3 text-destructive shrink-0" />
          <span className="capitalize">Failed</span>
        </div>
      );
    default:
      return null;
  }
};

const VersionDisplay: React.FC<{ version: SharedCodeMappingSchemaI }> = ({ version }) => {
  if (
    [SourceTypeEnum.PASTE, SourceTypeEnum.UPLOAD_FILE, SourceTypeEnum.UPLOAD_FOLDER].includes(
      version.source_type,
    )
  ) {
    return null;
  }

  if (version.source_type === SourceTypeEnum.SCAN && version.network) {
    const url = explorerUrl(version.network, version.version_identifier);

    return (
      <Button asChild variant="ghost" className="text-xs  font-mono">
        <a href={url} target="_blank" referrerPolicy="no-referrer">
          <span>{truncateVersion(version.version_identifier)}</span>
          <span className="mx-1">|</span>
          <Network className="size-4" />
          <span>{version.network}</span>
        </a>
      </Button>
    );
  }

  if (version.source_type === SourceTypeEnum.REPOSITORY && version.repository) {
    const url = version.repository.url + "/commit/" + version.commit?.sha;
    return (
      <Button asChild variant="ghost" className="text-xs font-mono">
        <a href={url} target="_blank" referrerPolicy="no-referrer">
          <span>{version?.branch}</span>
          <GitCommit className="size-3" />
          <span>{truncateId(version.version_identifier)}</span>
        </a>
      </Button>
    );
  }
};

const CodeMetadata: React.FC<{
  code: SharedCodeMappingSchemaI;
}> = ({ code }) => {
  return (
    <div className="grid pb-4 lg:pt-4 px-2" style={{ gridTemplateColumns: "250px 1fr" }}>
      <h3>{code.inferred_name}</h3>
      <div className="flex justify-between gap-10">
        <div className="flex items-center justify-end w-full gap-3 text-sm text-muted-foreground">
          {getStatusIndicator(code.status)}
          <VersionDisplay version={code} />
          <div className="flex items-center gap-1.5">
            <span>{formatDateShort(code.commit?.timestamp ?? code.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeMetadata;
