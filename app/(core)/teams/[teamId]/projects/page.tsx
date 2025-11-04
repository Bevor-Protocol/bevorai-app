import { breadcrumbActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { getQueryClient } from "@/lib/config/query";
import { QUERY_KEYS } from "@/utils/constants";
import { extractProjectsQuery } from "@/utils/queries";
import { AsyncComponent } from "@/utils/types";
import ProjectsPageClient, { ProjectCreate } from "./projects-page-client";

interface PageProps {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ [key: string]: string }>;
}

const TeamProjectsPage: AsyncComponent<PageProps> = async ({ params, searchParams }) => {
  const queryClient = getQueryClient();
  const { teamId } = await params;
  const resolvedSearchParams = await searchParams;

  const query = extractProjectsQuery(resolvedSearchParams);

  const breadcrumb = await queryClient.fetchQuery({
    queryKey: [QUERY_KEYS.BREADCRUMBS, teamId, "projects"],
    queryFn: async () => breadcrumbActions.getProjectsBreadcrumb(teamId),
  });

  return (
    <Container breadcrumb={<ContainerBreadcrumb breadcrumb={breadcrumb} />}>
      <div className="flex flex-row mb-8 justify-between">
        <div className="flex flex-row items-center gap-4">
          <h3 className="text-foreground">Projects</h3>
        </div>
        <ProjectCreate teamId={teamId} />
      </div>
      <ProjectsPageClient teamId={teamId} query={query} />
    </Container>
  );
};

export default TeamProjectsPage;
