import { codeActions, userActions } from "@/actions/bevor";
import CodeMetadata from "@/app/(core)/[teamSlug]/[projectSlug]/codes/[codeId]/metadata";
import SourcesViewer from "@/app/(core)/[teamSlug]/[projectSlug]/codes/[codeId]/sources-viewer";
import Container from "@/components/container";
import CodeVersionSubnav from "@/components/subnav/code-version";
import { getQueryClient } from "@/lib/config/query";
import { CodeProvider } from "@/providers/code";
import { generateQueryKey } from "@/utils/constants";
import { extractAnalysisThreadsQuery } from "@/utils/query-params";
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

  const [version, tree, user] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: generateQueryKey.code(resolvedParams.codeId),
      queryFn: () => codeActions.getCodeVersion(resolvedParams.teamSlug, resolvedParams.codeId),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.codeTree(resolvedParams.codeId),
      queryFn: () => codeActions.getTree(resolvedParams.teamSlug, resolvedParams.codeId),
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
    if (!tree.find((s) => s.id == source)) {
      initialSourceId = null;
    }
  }
  if (!initialSourceId) {
    initialSourceId = tree.length ? tree[0].id : null;
  }
  if (initialSourceId) {
    await queryClient.fetchQuery({
      queryKey: generateQueryKey.codeSource(resolvedParams.codeId, initialSourceId),
      queryFn: () =>
        codeActions.getCodeVersionSource(
          resolvedParams.teamSlug,
          resolvedParams.codeId,
          initialSourceId,
        ),
    });
  }

  let position: { start: number; end: number } | undefined;
  if (node) {
    for (const s of tree) {
      for (const c of s.contracts) {
        for (const f of c.functions) {
          if (f.id == node) {
            position = { start: f.src_start_pos, end: f.src_end_pos };
          }
        }
      }
    }
  }

  const analysisQuery = extractAnalysisThreadsQuery({
    project_slug: resolvedParams.projectSlug,
    user_id: user.id,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CodeProvider
        initialSourceId={initialSourceId}
        initialPosition={position}
        {...resolvedParams}
      >
        <Container subnav={<CodeVersionSubnav />}>
          <CodeMetadata
            teamSlug={resolvedParams.teamSlug}
            projectSlug={resolvedParams.projectSlug}
            analysisQuery={analysisQuery}
            version={version}
          />
          <SourcesViewer tree={tree} teamSlug={resolvedParams.teamSlug} codeId={version.id} />
        </Container>
      </CodeProvider>
    </HydrationBoundary>
  );
};

export default SourcesPage;
