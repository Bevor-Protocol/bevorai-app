import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { extractTeamAnalysesQuery } from "@/utils/queries";
import { AsyncComponent } from "@/utils/types";
import AnalysesData, { AnalysisCreate } from "./analyses-client";

type ResolvedParams = {
  teamSlug: string;
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
      breadcrumb={
        <ContainerBreadcrumb
          queryKey={[resolvedParams.teamSlug]}
          queryType="analyses"
          teamSlug={resolvedParams.teamSlug}
          id=""
        />
      }
      className="flex flex-col"
    >
      <div className="flex flex-row mb-8 justify-between">
        <div>
          <h3>Analysis Threads</h3>
          <p className="text-muted-foreground mt-4 text-sm">
            List of analysis threads, which can be considered user-scoped threads of reasoning about
            code and security analyses
          </p>
        </div>
        <AnalysisCreate teamSlug={resolvedParams.teamSlug} />
      </div>
      <AnalysesData query={query} {...resolvedParams} />
    </Container>
  );
};

export default TeamAnalysesPage;
