import Container from "@/components/container";
import { AnalysisThreadsView } from "@/components/screens/analysis-threads";
import TeamSubnav from "@/components/subnav/team";
import { DefaultAnalysisThreadsQuery, extractAnalysisThreadsQuery } from "@/utils/query-params";
import { AsyncComponent } from "@/utils/types";
import { AnalysisCreate } from "./analyses-client";

type ResolvedParams = {
  teamSlug: string;
};

interface ProjectAnalysesPageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<Partial<typeof DefaultAnalysisThreadsQuery>>;
}

const TeamAnalysesPage: AsyncComponent<ProjectAnalysesPageProps> = async ({
  params,
  searchParams,
}) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const initialQuery = extractAnalysisThreadsQuery(resolvedSearchParams);
  const defaultQuery = { ...DefaultAnalysisThreadsQuery };

  return (
    <Container subnav={<TeamSubnav />}>
      <div className="max-w-7xl mx-auto">
        <div className="border-b">
          <div className="px-6 py-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-1">Analysis Threads</h1>
              <p className="text-sm text-muted-foreground">
                User-scoped threads of reasoning about code and security analyses
              </p>
            </div>
            <AnalysisCreate teamSlug={resolvedParams.teamSlug} />
          </div>
        </div>
        <div className="px-6 py-6">
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

export default TeamAnalysesPage;
