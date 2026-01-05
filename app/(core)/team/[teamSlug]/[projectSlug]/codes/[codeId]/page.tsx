import { codeActions, userActions } from "@/actions/bevor";
import Container from "@/components/container";
import CodeVersionSubnav from "@/components/subnav/code-version";
import CodeMetadata from "@/components/views/code/metadata";
import SourcesViewer from "@/components/views/code/sources-viewer";
import { getQueryClient } from "@/lib/config/query";
import { CodeProvider } from "@/providers/code";
import { generateQueryKey } from "@/utils/constants";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

type ResolvedParams = {
  codeId: string;
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

  const [, sources, user] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: generateQueryKey.code(resolvedParams.codeId),
      queryFn: () =>
        codeActions.getCodeVersion(resolvedParams.teamSlug, resolvedParams.codeId).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.codeSources(resolvedParams.codeId),
      queryFn: () =>
        codeActions.getSources(resolvedParams.teamSlug, resolvedParams.codeId).then((r) => {
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
      queryFn: () =>
        codeActions.getNode(resolvedParams.teamSlug, resolvedParams.codeId, node).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    });
    position = { start: fetchedNode.src_start_pos, end: fetchedNode.src_end_pos };
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CodeProvider
        initialSourceId={initialSourceId}
        initialPosition={position}
        {...resolvedParams}
      >
        <Container subnav={<CodeVersionSubnav />}>
          <CodeMetadata userId={user.id} {...resolvedParams} allowActions />
          <SourcesViewer sources={sources} {...resolvedParams} />
        </Container>
      </CodeProvider>
    </HydrationBoundary>
  );
};

export default SourcesPage;
