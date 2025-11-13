import { teamActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { extractAnalysesQuery } from "@/utils/queries";
import { AsyncComponent } from "@/utils/types";
import AnalysesData, { AnalysisCreate } from "./analyses-client";

type ResolvedParams = {
  teamId: string;
  projectId: string;
};

interface PageProps {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ [key: string]: string }>;
}

const ProjectAnalysesPage: AsyncComponent<PageProps> = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const currentUser = await teamActions.getCurrentMember(resolvedParams.teamId);

  const query = extractAnalysesQuery(resolvedParams.projectId, {
    user_id: currentUser.user.id,
    ...resolvedSearchParams,
  });

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb
          queryKey={[resolvedParams.projectId]}
          queryType="project-analyses"
          teamId={resolvedParams.teamId}
          id={resolvedParams.projectId}
        />
      }
      className="flex flex-col"
    >
      <div className="flex flex-row mb-8 justify-between">
        <div className="flex flex-row items-center gap-4">
          <h3 className="text-foreground">Analyses</h3>
        </div>
        <AnalysisCreate {...resolvedParams} />
      </div>
      <AnalysesData query={query} {...resolvedParams} />
    </Container>
  );
};

export default ProjectAnalysesPage;
