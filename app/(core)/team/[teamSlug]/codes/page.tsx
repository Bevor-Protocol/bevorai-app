import { userActions } from "@/actions/bevor";
import Container from "@/components/container";
import { CodeVersionsView } from "@/components/screens/code-versions";
import TeamSubnav from "@/components/subnav/team";
import { DefaultCodesQuery, extractCodesQuery } from "@/utils/query-params";
import { AsyncComponent } from "@/utils/types";
import { CodeCreate } from "./codes-client";

interface ResolvedParams {
  teamSlug: string;
}

interface ProjectPageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ [key: string]: string }>;
}

const TeamCodesPage: AsyncComponent<ProjectPageProps> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const currentUser = await userActions.get();

  const initialQuery = extractCodesQuery({
    ...resolvedSearchParams,
    user_id: currentUser.id,
  });

  const defaultQuery = { ...DefaultCodesQuery };

  return (
    <Container subnav={<TeamSubnav />}>
      <div className="max-w-7xl mx-auto">
        <div className="border-b">
          <div className="py-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-1">Code Versions</h1>
            </div>
            <CodeCreate teamSlug={resolvedParams.teamSlug} />
          </div>
        </div>
        <CodeVersionsView
          {...resolvedParams}
          initialQuery={initialQuery}
          defaultQuery={defaultQuery}
          showRepo
        />
      </div>
    </Container>
  );
};

export default TeamCodesPage;
