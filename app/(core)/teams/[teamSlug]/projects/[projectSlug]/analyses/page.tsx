import { teamActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { extractAnalysesQuery } from "@/utils/queries";
import { AsyncComponent } from "@/utils/types";
import AnalysesData, { AnalysisCreate } from "./analyses-client";

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

  const currentUser = await teamActions.getCurrentMember(resolvedParams.teamSlug);

  const query = extractAnalysesQuery(resolvedParams.projectSlug, {
    user_id: currentUser.user.id,
    ...resolvedSearchParams,
  });

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb
          queryKey={[resolvedParams.projectSlug]}
          queryType="project-analyses"
          teamSlug={resolvedParams.teamSlug}
          id={resolvedParams.projectSlug}
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
        <AnalysisCreate {...resolvedParams} />
      </div>
      <AnalysesData query={query} {...resolvedParams} />
    </Container>
  );
};

export default ProjectAnalysesPage;
