import Container from "@/components/container";
import { extractTeamAnalysesQuery } from "@/utils/queries";
import { AsyncComponent } from "@/utils/types";
import AnalysesData, { AnalysisCreate } from "./analyses-client";
import ContainerBreadcrumb from "./breadcrumb";

type ResolvedParams = {
  teamId: string;
};

interface ProjectAnalysesPageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ [key: string]: string }>;
}

const TeamAnalysesPage: AsyncComponent<ProjectAnalysesPageProps> = async ({
  params,
  searchParams,
}) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const query = extractTeamAnalysesQuery(resolvedSearchParams);

  return (
    <Container
      breadcrumb={<ContainerBreadcrumb teamId={resolvedParams.teamId} />}
      className="flex flex-col"
    >
      <div className="flex flex-row mb-8 justify-between">
        <div className="flex flex-row items-center gap-4">
          <h3 className="text-foreground">Analyses</h3>
        </div>
        <AnalysisCreate teamId={resolvedParams.teamId} />
      </div>
      <AnalysesData query={query} {...resolvedParams} />
    </Container>
  );
};

export default TeamAnalysesPage;
