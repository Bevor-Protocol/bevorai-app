import { analysisActions, userActions } from "@/actions/bevor";
import Container from "@/components/container";
import { AnalysisNodesHistoryView } from "@/components/screens/nodes-history";
import AnalysisSubnav from "@/components/subnav/analysis";
import { DefaultAnalysisNodesQuery, extractAnalysisNodesQuery } from "@/utils/query-params";
import { AsyncComponent } from "@/utils/types";

type ResolvedParams = {
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
};

interface PageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<Partial<typeof DefaultAnalysisNodesQuery> & { user?: string }>;
}

const AnalysisNodesHistoryPage: AsyncComponent<PageProps> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const { user, ...resolvedSearchParams } = await searchParams;

  const analysis = await analysisActions.getAnalysis(
    resolvedParams.teamSlug,
    resolvedParams.nodeId,
  );

  const initialQuery = extractAnalysisNodesQuery({
    ...resolvedSearchParams,
    project_slug: resolvedParams.projectSlug,
    root_node_id: analysis.root_node_id,
  });

  if (user !== "unset") {
    const currentUser = await userActions.get();
    initialQuery.user_id = currentUser.id;
  }

  const defaultQuery = {
    ...DefaultAnalysisNodesQuery,
    project_slug: resolvedParams.projectSlug,
    root_node_id: analysis.root_node_id,
  };

  return (
    <Container subnav={<AnalysisSubnav />}>
      <div className="max-w-7xl mx-auto">
        <div className="border-b">
          <div className="py-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-1">Analysis Node History</h1>
              <p className="text-sm text-muted-foreground">Lineage of analyses for this node</p>
            </div>
          </div>
          <div className="flex gap-2 items-center text-sm my-2 text-muted-foreground">
            <div className="inline-flex items-center gap-1">
              <span className="size-2 bg-blue-300 rounded-full block" />
              Current
            </div>
            <div className="inline-flex items-center gap-1">
              <span className="size-2 bg-purple-300 rounded-full block" />
              Parent
            </div>
            <div className="inline-flex items-center gap-1">
              <span className="size-2 bg-orange-300 rounded-full block" />
              Child
            </div>
          </div>
        </div>
        <div className="py-6">
          <AnalysisNodesHistoryView
            initialQuery={initialQuery}
            defaultQuery={defaultQuery}
            node={analysis}
            {...resolvedParams}
          />
        </div>
      </div>
    </Container>
  );
};

export default AnalysisNodesHistoryPage;
