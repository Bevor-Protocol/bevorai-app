import { analysisActions } from "@/actions/bevor";
import AnalysisNodeMetadata from "@/app/(core)/[teamSlug]/[projectSlug]/analysis-threads/[threadId]/nodes/[nodeId]/metadata";
import Container from "@/components/container";
import AnalysisThreadSubnav from "@/components/subnav/analysis-thread";
import { AsyncComponent } from "@/utils/types";
import { AnalysisVersionClient } from "./analysis-version-client";
import { EditClient } from "./edit-mode";

type ResolvedParams = {
  threadId: string;
  nodeId: string;
  teamSlug: string;
  projectSlug: string;
};

type Props = {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ mode?: string }>;
};

const SourcesPage: AsyncComponent<Props> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const analysisVersion = await analysisActions.getAnalysisVersion(
    resolvedParams.teamSlug,
    resolvedParams.nodeId,
  );

  const isEditMode = resolvedSearchParams.mode === "edit";

  return (
    <Container subnav={<AnalysisThreadSubnav />}>
      <AnalysisNodeMetadata {...resolvedParams} version={analysisVersion} isEditMode={isEditMode} />
      {isEditMode ? (
        <EditClient
          teamSlug={resolvedParams.teamSlug}
          nodeId={resolvedParams.nodeId}
          projectSlug={resolvedParams.projectSlug}
          threadId={resolvedParams.threadId}
        />
      ) : (
        <AnalysisVersionClient {...resolvedParams} analysisVersion={analysisVersion} />
      )}
    </Container>
  );
};

export default SourcesPage;
