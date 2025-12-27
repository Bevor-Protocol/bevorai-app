import { sharedActions } from "@/actions/bevor";
import Container from "@/components/container";
import SharedSubnav from "@/components/subnav/shared";
import { getQueryClient } from "@/lib/config/query";
import { generateQueryKey } from "@/utils/constants";
import { AsyncComponent, SharedAnalysisNodeSchemaI } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import AnalysisHolder from "./client";

type ResolvedParams = {
  nodeId: string;
};

type Props = {
  params: Promise<ResolvedParams>;
};

const AnalysisPage: AsyncComponent<Props> = async ({ params }) => {
  const queryClient = getQueryClient();
  const resolvedParams = await params;

  let analysis: SharedAnalysisNodeSchemaI;
  try {
    analysis = await queryClient.fetchQuery({
      queryKey: generateQueryKey.analysisDetailed(resolvedParams.nodeId),
      queryFn: async () => sharedActions.getAnalysis(resolvedParams.nodeId),
    });
  } catch {
    return (
      <div className="h-[calc(100svh-var(--spacing-header))] flex items-center justify-center">
        No analysis to view.
      </div>
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Container subnav={<SharedSubnav />}>
        <AnalysisHolder analysis={analysis} />
      </Container>
    </HydrationBoundary>
  );
};

export default AnalysisPage;
