import { userActions } from "@/actions/bevor";
import Container from "@/components/container";
import { AnalysisNodesView } from "@/components/screens/nodes";
import TeamSubnav from "@/components/subnav/team";
import { DefaultAnalysisNodesQuery, extractAnalysisNodesQuery } from "@/utils/query-params";
import { AsyncComponent } from "@/utils/types";
import { AnalysisCreate } from "./analyses-client";

type ResolvedParams = {
  teamSlug: string;
};

interface ProjectAnalysesPageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<Partial<typeof DefaultAnalysisNodesQuery>>;
}

const TeamAnalysesPage: AsyncComponent<ProjectAnalysesPageProps> = async ({
  params,
  searchParams,
}) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const currentUser = await userActions.get();

  const initialQuery = extractAnalysisNodesQuery({
    ...resolvedSearchParams,
    user_id: currentUser.id,
  });
  const defaultQuery = { ...DefaultAnalysisNodesQuery };

  return (
    <Container subnav={<TeamSubnav />}>
      <div className="max-w-7xl mx-auto">
        <div className="border-b">
          <div className="px-6 py-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-1">Analyses</h1>
              <p className="text-sm text-muted-foreground">User-scoped security analyses</p>
            </div>
            <AnalysisCreate teamSlug={resolvedParams.teamSlug} />
          </div>
        </div>
        <div className="px-6 py-6">
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

export default TeamAnalysesPage;
