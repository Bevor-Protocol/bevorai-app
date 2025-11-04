import { breadcrumbActions, versionActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getQueryClient } from "@/lib/config/query";
import { formatDate, truncateVersion } from "@/utils/helpers";
import { AsyncComponent } from "@/utils/types";
import { Calendar, ExternalLink, Network } from "lucide-react";
import Relations from "./relations";
import SourcesViewer from "./sources-viewer";

type ResolvedParams = {
  versionId: string;
  teamId: string;
};

type Props = {
  params: Promise<ResolvedParams>;
};

const SourcesPage: AsyncComponent<Props> = async ({ params }) => {
  const queryClient = getQueryClient();
  const resolvedParams = await params;

  const [version, sources, breadcrumbs] = await Promise.all([
    versionActions.getCodeVersion(resolvedParams.teamId, resolvedParams.versionId),
    versionActions.getCodeVersionSources(resolvedParams.teamId, resolvedParams.versionId),
    queryClient.fetchQuery({
      queryKey: ["breadcrumbs", "code", resolvedParams.versionId],
      queryFn: async () =>
        breadcrumbActions.getCodeVersionBreadcrumb(resolvedParams.teamId, resolvedParams.versionId),
    }),
  ]);

  return (
    <Container breadcrumb={<ContainerBreadcrumb breadcrumb={breadcrumbs} />} className="pt-0">
      <ScrollArea className="h-[calc(100svh-(42px+14px+21px))] pr-2">
        {/* <ScrollArea className="h-[500px]"> */}
        <div className="flex flex-row justify-between pb-4 lg:pt-4">
          <div className="flex flex-row gap-6 items-center justify-between w-full">
            <h3>
              Code Version{" - "} {version.version_number}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <span>Method: {version.version.source_type}</span>
              </div>
              {version.version.network && (
                <div className="flex items-center space-x-1">
                  <Network className="size-4" />
                  <span>{version.version.network}</span>
                </div>
              )}
              {version.version.solc_version && (
                <div className="flex items-center space-x-1">
                  {truncateVersion({
                    versionMethod: version.version.version_method,
                    versionIdentifier: version.version.version_identifier,
                  })}
                </div>
              )}
              {version.version.source_url && (
                <div>
                  <span className="text-muted-foreground">Source URL:</span>
                  <span className="ml-2 text-blue-400 flex items-center space-x-1">
                    <span>View Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-1">
                <Calendar className="size-4" />
                <span>{formatDate(version.created_at)}</span>
              </div>
            </div>
          </div>
          <Relations version={version} teamId={resolvedParams.teamId} />
        </div>
        <SourcesViewer
          teamId={resolvedParams.teamId}
          versionId={resolvedParams.versionId}
          sources={sources}
        />
      </ScrollArea>
      {/* <ChatPanel version={version} teamId={resolvedParams.teamId} /> */}
    </Container>
  );
};

export default SourcesPage;
