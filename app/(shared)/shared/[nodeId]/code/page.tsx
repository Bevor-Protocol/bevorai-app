import { sharedActions } from "@/actions/bevor";
import Container from "@/components/container";
import SharedSubnav from "@/components/subnav/shared";
import { getQueryClient } from "@/lib/config/query";
import { AsyncComponent } from "@/types";
import { AnalysisNodeSchema } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import SourcesViewer from "./file-viewer";
import CodeMetadata from "./metadata";
import { CodeProvider } from "./provider";

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

  let analysis: AnalysisNodeSchema;
  try {
    analysis = await queryClient.fetchQuery({
      queryKey: generateQueryKey.analysisDetailed(resolvedParams.nodeId),
      queryFn: async () =>
        sharedActions.getAnalysis(resolvedParams.nodeId).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    });
  } catch {
    return (
      <div className="h-[calc(100svh-var(--spacing-header))] flex items-center justify-center">
        No analysis to view.
      </div>
    );
  }

  const [code, sources] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: generateQueryKey.code(resolvedParams.nodeId),
      queryFn: () =>
        sharedActions.getCode(resolvedParams.nodeId).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.codeFiles(resolvedParams.nodeId),
      queryFn: () =>
        sharedActions.getFiles(resolvedParams.nodeId).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
  ]);

  // Prefetch the initial source data so it's available immediately on the client
  let initialFileId = source ?? null;
  if (initialFileId) {
    // validate that the query param exists on this code version. If not, unset it, default to first.
    if (!sources.find((s) => s.id == source)) {
      initialFileId = null;
    }
  }
  if (!initialFileId) {
    initialFileId = sources.length ? sources[0].id : null;
  }

  let position: { start: number; end: number } | undefined;
  if (node) {
    const fetchedNode = await queryClient.fetchQuery({
      queryKey: generateQueryKey.codeNode(node),
      queryFn: () =>
        sharedActions.getNode(resolvedParams.nodeId, node).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    });
    position = { start: fetchedNode.src_start_pos, end: fetchedNode.src_end_pos };
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CodeProvider
        initialFileId={initialFileId}
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
