import Container from "@/components/container";
import { AnalysisNodesView } from "@/components/screens/nodes";
import AnalysisThreadSubnav from "@/components/subnav/analysis-thread";
import { DefaultAnalysisNodesQuery, extractAnalysisNodesQuery } from "@/utils/query-params";
import { AsyncComponent } from "@/utils/types";

type ResolvedParams = {
  teamSlug: string;
  threadId: string;
  projectSlug: string;
};

interface PageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ [key: string]: string }>;
}

const AnalysisNodesPage: AsyncComponent<PageProps> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const initialQuery = extractAnalysisNodesQuery({
    ...resolvedSearchParams,
    analysis_thread_id: resolvedParams.threadId,
    project_slug: resolvedParams.projectSlug,
  });

  const defaultQuery = {
    ...DefaultAnalysisNodesQuery,
    analysis_thread_id: resolvedParams.threadId,
    project_slug: resolvedParams.projectSlug,
  };

  return (
    <Container subnav={<AnalysisThreadSubnav />}>
      <div className="max-w-7xl mx-auto">
        <div className="border-b">
          <div className="py-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-1">Analysis Nodes</h1>
              <p className="text-sm text-muted-foreground">
                User-scoped security analysis nodes for the given thread.
              </p>
            </div>
            {/* <AnalysisCreate {...resolvedParams} /> */}
          </div>
        </div>
        <div className="py-6">
          <AnalysisNodesView
            initialQuery={initialQuery}
            defaultQuery={defaultQuery}
            {...resolvedParams}
          />
        </div>
      </div>
    </Container>
  );
};

export default AnalysisNodesPage;
