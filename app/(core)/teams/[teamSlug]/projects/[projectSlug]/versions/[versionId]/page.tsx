import { bevorAction } from "@/actions";
import Container from "@/components/container";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { formatDate, truncateVersion } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { AsyncComponent } from "@/utils/types";
import { Calendar, ExternalLink, Network } from "lucide-react";
import ChatPanel from "./chat-panel";
import SourcesViewer from "./sources-viewer";

type ResolvedParams = {
  versionId: string;
  teamSlug: string;
  projectSlug: string;
};

type Props = {
  params: Promise<ResolvedParams>;
};

const CodeVersionBreadCrumb = (params: ResolvedParams) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={navigation.team.overview(params)}>{params.teamSlug}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href={navigation.project.overview(params)}>
            {params.projectSlug}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href={navigation.project.versions.overview(params)}>
            code versions
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

const SourcesPage: AsyncComponent<Props> = async ({ params }) => {
  const resolvedParams = await params;
  const version = await bevorAction.getContractVersion(resolvedParams.versionId);
  const sources = await bevorAction.getContractVersionSources(resolvedParams.versionId);

  return (
    <Container breadcrumb={<CodeVersionBreadCrumb {...resolvedParams} />}>
      <div className="flex flex-row justify-between mb-8 border-b border-b-neutral-800 py-4">
        <div>
          <h1>
            Version{" - "}
            {truncateVersion({
              versionMethod: version.version_identifier,
              versionIdentifier: version.version_identifier,
            })}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
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
                <span className="text-muted-foreground">Source URL:</span>
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
      </div>
      <SourcesViewer version={version} sources={sources} />
      <ChatPanel
        versionId={resolvedParams.versionId}
        teamSlug={resolvedParams.teamSlug}
        projectSlug={resolvedParams.projectSlug}
      />
    </Container>
  );
};

export default SourcesPage;
