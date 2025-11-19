import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { extractProjectsQuery } from "@/utils/queries";
import { AsyncComponent } from "@/utils/types";
import ProjectsPageClient, { ProjectCreate } from "./projects-page-client";

interface PageProps {
  params: Promise<{ teamSlug: string }>;
  searchParams: Promise<{ [key: string]: string }>;
}

const TeamProjectsPage: AsyncComponent<PageProps> = async ({ params, searchParams }) => {
  const { teamSlug } = await params;
  const resolvedSearchParams = await searchParams;

  const query = extractProjectsQuery(resolvedSearchParams);

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb queryKey={[teamSlug]} queryType="projects" teamSlug={teamSlug} id="" />
      }
    >
      <div className="flex flex-row mb-8 justify-between">
        <div className="flex flex-row items-center gap-4">
          <h3 className="text-foreground">Projects</h3>
        </div>
        <ProjectCreate teamSlug={teamSlug} />
      </div>
      <ProjectsPageClient teamSlug={teamSlug} query={query} />
    </Container>
  );
};

export default TeamProjectsPage;
