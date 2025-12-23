import { analysisActions, codeActions, userActions } from "@/actions/bevor";
import Container from "@/components/container";
import AnalysisSubnav from "@/components/subnav/analysis";
import CodeMetadata from "@/components/views/code/metadata";
import SourcesViewer from "@/components/views/code/sources-viewer";
import { getQueryClient } from "@/lib/config/query";
import { CodeProvider } from "@/providers/code";
import { generateQueryKey } from "@/utils/constants";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

type ResolvedParams = {
  nodeId: string;
  projectSlug: string;
  teamSlug: string;
};

type Props = {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ source?: string; node?: string }>;
};

const SourcesPage: AsyncComponent<Props> = async ({ params, searchParams }) => {
  const queryClient = getQueryClient();
  const resolvedParams = await params;
  const { source, node } = await searchParams;

  const analysis = await analysisActions.getAnalysis(
    resolvedParams.teamSlug,
    resolvedParams.nodeId,
  );

  const [, sources, user] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: generateQueryKey.code(analysis.code_version_id),
      queryFn: () => codeActions.getCodeVersion(resolvedParams.teamSlug, analysis.code_version_id),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.codeSources(analysis.code_version_id),
      queryFn: () => codeActions.getSources(resolvedParams.teamSlug, analysis.code_version_id),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.currentUser(),
      queryFn: () => userActions.get(),
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
      queryFn: () => codeActions.getNode(analysis.code_version_id, node),
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
        <Container subnav={<AnalysisSubnav />}>
          <CodeMetadata userId={user.id} codeId={analysis.code_version_id} {...resolvedParams} />
          <SourcesViewer sources={sources} {...resolvedParams} codeId={analysis.code_version_id} />
        </Container>
      </CodeProvider>
    </HydrationBoundary>
  );
};

export default SourcesPage;
