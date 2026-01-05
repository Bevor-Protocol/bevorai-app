import Container from "@/components/container";
import { AnalysisNodesView } from "@/components/screens/nodes";
import ProjectSubnav from "@/components/subnav/project";
import { AnalysisCreate } from "@/components/views/analysis/creation";
import { DefaultAnalysisNodesQuery, extractAnalysisNodesQuery } from "@/utils/query-params";
import { AsyncComponent } from "@/utils/types";

type ResolvedParams = {
  teamSlug: string;
  projectSlug: string;
};

interface PageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<Partial<typeof DefaultAnalysisNodesQuery>>;
}

const AnalysisNodesPage: AsyncComponent<PageProps> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const initialQuery = extractAnalysisNodesQuery({
    ...resolvedSearchParams,
    project_slug: resolvedParams.projectSlug,
    is_leaf: "true",
  });

  const defaultQuery = {
    ...DefaultAnalysisNodesQuery,
    project_slug: resolvedParams.projectSlug,
  };

  return (
    <Container subnav={<ProjectSubnav />}>
      <div className="max-w-7xl mx-auto">
        <div className="border-b">
          <div className="py-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-1">Analyses</h1>
              <p className="text-sm text-muted-foreground">
                User-scoped security analyses. A root analysis is the initial form of that analysis,
                a leaf is the most recent.
              </p>
            </div>
            <AnalysisCreate {...resolvedParams} />
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
