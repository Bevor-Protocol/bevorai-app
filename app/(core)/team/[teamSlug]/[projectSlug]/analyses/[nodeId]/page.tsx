import { analysisActions } from "@/actions/bevor";
import AnalysisNodeMetadata from "@/app/(core)/team/[teamSlug]/[projectSlug]/analyses/[nodeId]/metadata";
import Container from "@/components/container";
import AnalysisSubnav from "@/components/subnav/analysis";
import { getQueryClient } from "@/lib/config/query";
import { generateQueryKey } from "@/utils/constants";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { AnalysisVersionClient } from "./analysis-version-client";
import { EditClient } from "./edit-mode";

type ResolvedParams = {
  nodeId: string;
  teamSlug: string;
  projectSlug: string;
};

type Props = {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ mode?: string }>;
};

const AnalysisPage: AsyncComponent<Props> = async ({ params, searchParams }) => {
  const queryClient = getQueryClient();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const isEditMode = resolvedSearchParams.mode === "edit";

  if (isEditMode) {
    await Promise.all([
      queryClient.fetchQuery({
        queryKey: generateQueryKey.analysisDraft(resolvedParams.nodeId),
        queryFn: () => analysisActions.getDraft(resolvedParams.teamSlug, resolvedParams.nodeId),
      }),
      queryClient.fetchQuery({
        queryKey: generateQueryKey.analysisDetailed(resolvedParams.nodeId),
        queryFn: () =>
          analysisActions.getAnalysisDetailed(resolvedParams.teamSlug, resolvedParams.nodeId),
      }),
    ]);
  } else {
    await queryClient.fetchQuery({
      queryKey: generateQueryKey.analysisDetailed(resolvedParams.nodeId),
      queryFn: async () =>
        analysisActions.getAnalysisDetailed(resolvedParams.teamSlug, resolvedParams.nodeId),
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Container subnav={<AnalysisSubnav />}>
        <AnalysisNodeMetadata {...resolvedParams} isEditMode={isEditMode} />
        {isEditMode ? (
          <EditClient
            teamSlug={resolvedParams.teamSlug}
            nodeId={resolvedParams.nodeId}
            projectSlug={resolvedParams.projectSlug}
          />
        ) : (
          <AnalysisVersionClient {...resolvedParams} />
        )}
      </Container>
    </HydrationBoundary>
  );
};

export default AnalysisPage;
