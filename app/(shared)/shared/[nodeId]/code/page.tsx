import { sharedActions } from "@/actions/bevor";
import Container from "@/components/container";
import SharedSubnav from "@/components/subnav/shared";
import { getQueryClient } from "@/lib/config/query";
import { generateQueryKey } from "@/utils/constants";
import { AnalysisNodeSchemaI, AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import CodeMetadata from "./metadata";
import { CodeProvider } from "./provider";
import SourcesViewer from "./sources-viewer";

type ResolvedParams = {
  nodeId: string;
};

type Props = {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ source?: string; node?: string }>;
};

const SourcesPage: AsyncComponent<Props> = async ({ params, searchParams }) => {
  const queryClient = getQueryClient();
  const resolvedParams = await params;
  const { source, node } = await searchParams;

  let analysis: AnalysisNodeSchemaI;
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

  if (!analysis.is_public) {
    // this should not be hit, as we throw in the API.
    return (
      <div className="h-[calc(100svh-var(--spacing-header))] flex items-center justify-center">
        No analysis to view.
      </div>
    );
  }

  const [code, sources] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: generateQueryKey.code(resolvedParams.nodeId),
      queryFn: () => sharedActions.getCode(resolvedParams.nodeId),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.codeSources(resolvedParams.nodeId),
      queryFn: () => sharedActions.getSources(resolvedParams.nodeId),
    }),
  ]);

  // Prefetch the initial source data so it's available immediately on the client
  let initialSourceId = source ?? null;
  if (initialSourceId) {
    // validate that the query param exists on this code version. If not, unset it, default to first.
    if (!sources.find((s) => s.id == source)) {
      initialSourceId = null;
    }
  }
  if (!initialSourceId) {
    initialSourceId = sources.length ? sources[0].id : null;
  }

  let position: { start: number; end: number } | undefined;
  if (node) {
    const fetchedNode = await queryClient.fetchQuery({
      queryKey: generateQueryKey.codeNode(node),
      queryFn: () => sharedActions.getNode(resolvedParams.nodeId, node),
    });
    position = { start: fetchedNode.src_start_pos, end: fetchedNode.src_end_pos };
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CodeProvider
        initialSourceId={initialSourceId}
        initialPosition={position}
        codeId={analysis.code_version_id}
        {...resolvedParams}
      >
        <Container subnav={<SharedSubnav />}>
          <CodeMetadata code={code} />
          <SourcesViewer sources={sources} {...resolvedParams} />
        </Container>
      </CodeProvider>
    </HydrationBoundary>
  );
};

export default SourcesPage;
