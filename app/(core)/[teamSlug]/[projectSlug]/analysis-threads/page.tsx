import { userActions } from "@/actions/bevor";
import Container from "@/components/container";
import { AnalysisThreadsView } from "@/components/screens/analysis-threads";
import ProjectSubnav from "@/components/subnav/project";
import { DefaultAnalysisThreadsQuery, extractAnalysisThreadsQuery } from "@/utils/query-params";
import { AsyncComponent } from "@/utils/types";
import { AnalysisCreate } from "./analyses-client";

type ResolvedParams = {
  teamSlug: string;
  projectSlug: string;
};

interface PageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ [key: string]: string }>;
}

const ProjectAnalysesPage: AsyncComponent<PageProps> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const currentUser = await userActions.get();

  const initialQuery = extractAnalysisThreadsQuery({
    ...resolvedSearchParams,
    project_slug: resolvedParams.projectSlug,
    user_id: currentUser.id,
  });

  const defaultQuery = { ...DefaultAnalysisThreadsQuery, project_slug: resolvedParams.projectSlug };

  return (
    <Container subnav={<ProjectSubnav />}>
      <div className="max-w-7xl mx-auto">
        <div className="border-b">
          <div className="py-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-1">Analysis Threads</h1>
              <p className="text-sm text-muted-foreground">
                User-scoped threads of reasoning about code and security analyses
              </p>
            </div>
            <AnalysisCreate {...resolvedParams} />
          </div>
        </div>
        <div className="py-6">
          <AnalysisThreadsView
            initialQuery={initialQuery}
            defaultQuery={defaultQuery}
            {...resolvedParams}
          />
        </div>
      </div>
    </Container>
  );
};

export default ProjectAnalysesPage;
