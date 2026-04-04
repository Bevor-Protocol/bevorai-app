import { codeActions, userActions } from "@/actions/bevor";
import Container from "@/components/container";
import CodeVersionSubnav from "@/components/subnav/code-version";
import SourcesViewer from "@/components/views/code/file-viewer";
import CodeMetadata from "@/components/views/code/metadata";
import { getQueryClient } from "@/lib/config/query";
import { CodeProvider } from "@/providers/code";
import { AsyncComponent } from "@/types";
import { generateQueryKey } from "@/utils/constants";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export const dynamic = "force-dynamic"; // Or 'auto' if you want caching
export const revalidate = 0; // Disable ISR if not needed

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
      queryKey: generateQueryKey.codeFiles(resolvedParams.codeId),
      queryFn: () =>
        codeActions.getFiles(resolvedParams.teamSlug, resolvedParams.codeId).then((r) => {
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
    try {
      const fetchedNode = await queryClient.fetchQuery({
        queryKey: generateQueryKey.codeNode(node),
        queryFn: () =>
          codeActions.getNode(resolvedParams.teamSlug, resolvedParams.codeId, node).then((r) => {
            if (!r.ok) throw r;
            return r.data;
          }),
      });
      initialSourceId = fetchedNode.file_id;
      position = { start: fetchedNode.src_start_pos, end: fetchedNode.src_end_pos };
    } catch {
      // Intentionally empty — fetch failure is non-critical
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CodeProvider initialFileId={initialSourceId} initialPosition={position} {...resolvedParams}>
        <Container subnav={<CodeVersionSubnav />} contain>
          <CodeMetadata userId={user.id} {...resolvedParams} allowActions />
          <div className="flex flex-1 min-h-0">
            <div className="min-h-0 flex-1">
              <SourcesViewer {...resolvedParams} />
            </div>
          </div>
        </Container>
      </CodeProvider>
    </HydrationBoundary>
  );
};

export default SourcesPage;
