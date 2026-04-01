import { analysisActions, codeActions, userActions } from "@/actions/bevor";
import Container from "@/components/container";
import AnalysisSubnav from "@/components/subnav/analysis";
import SourcesViewer from "@/components/views/code/file-viewer";
import CodeMetadata from "@/components/views/code/metadata";
import { getQueryClient } from "@/lib/config/query";
import { CodeProvider } from "@/providers/code";
import { AsyncComponent } from "@/types";
import { generateQueryKey } from "@/utils/constants";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

type ResolvedParams = {
  nodeId: string;
  projectSlug: string;
  teamSlug: string;
};

type Props = {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ file?: string; node?: string }>;
};

const SourcesPage: AsyncComponent<Props> = async ({ params, searchParams }) => {
  const queryClient = getQueryClient();
  const resolvedParams = await params;
  const { file, node } = await searchParams;

  const analysis = await analysisActions
    .getAnalysis(resolvedParams.teamSlug, resolvedParams.nodeId)
    .then((r) => {
      if (!r.ok) throw r;
      return r.data;
    });

  const [, files, user] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: generateQueryKey.code(analysis.code_version_id),
      queryFn: () =>
        codeActions.getCodeVersion(resolvedParams.teamSlug, analysis.code_version_id).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.codeFiles(analysis.code_version_id),
      queryFn: () =>
        codeActions.getFiles(resolvedParams.teamSlug, analysis.code_version_id).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.currentUser(),
      queryFn: () =>
        userActions.get().then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
  ]);

  // Prefetch the initial source data so it's available immediately on the client
  let initialFileId = file ?? null;
  if (initialFileId) {
    // validate that the query param exists on this code version. If not, unset it, default to first.
    if (!files.find((s) => s.id == file)) {
      initialFileId = null;
    }
  }
  if (!initialFileId) {
    initialFileId = files.length ? files[0].id : null;
  }

  let position: { start: number; end: number } | undefined;
  if (node) {
    const fetchedNode = await queryClient.fetchQuery({
      queryKey: generateQueryKey.codeNode(node),
      queryFn: () =>
        codeActions.getNode(resolvedParams.teamSlug, analysis.code_version_id, node).then((r) => {
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
        <Container subnav={<AnalysisSubnav />} contain>
          <CodeMetadata
            userId={user.id}
            codeId={analysis.code_version_id}
            {...resolvedParams}
            allowActions
          />
          <div className="flex flex-1 min-h-0">
            <div className="min-h-0 flex-1">
              <SourcesViewer {...resolvedParams} codeId={analysis.code_version_id} />
            </div>
          </div>
        </Container>
      </CodeProvider>
    </HydrationBoundary>
  );
};

export default SourcesPage;
