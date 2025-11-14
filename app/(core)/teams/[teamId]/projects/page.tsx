import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { extractProjectsQuery } from "@/utils/queries";
import { AsyncComponent } from "@/utils/types";
import ProjectsPageClient, { ProjectCreate } from "./projects-page-client";

interface PageProps {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ [key: string]: string }>;
}

const TeamProjectsPage: AsyncComponent<PageProps> = async ({ params, searchParams }) => {
  const { teamId } = await params;
  const resolvedSearchParams = await searchParams;

  const query = extractProjectsQuery(resolvedSearchParams);

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb queryKey={[teamId]} queryType="projects" teamId={teamId} id="" />
      }
    >
      <div className="max-w-5xl m-auto mt-8 lg:mt-16">
        <div className="flex flex-row mb-8 justify-between">
          <div className="flex flex-row items-center gap-4">
            <h3 className="text-foreground">Projects</h3>
          </div>
          <ProjectCreate teamId={teamId} />
        </div>
        <ProjectsPageClient teamId={teamId} query={query} />
      </div>
    </Container>
  );
};

export default TeamProjectsPage;
