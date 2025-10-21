import { bevorAction } from "@/actions";
import Container from "@/components/container";
import { VersionGrid } from "@/components/versions/grid";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

interface ProjectPageProps {
  params: Promise<{ teamId: string; projectId: string }>;
}

const ProjectVersionsPage: AsyncComponent<ProjectPageProps> = async ({ params }) => {
  const { teamId, projectId } = await params;

  const project = await bevorAction.getProject(projectId);
  const query = { page_size: "9", project_id: project.id };

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["versions", query],
    queryFn: () => bevorAction.getVersions(query),
  });

  return (
    <Container>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <VersionGrid teamId={teamId} query={query} />
      </HydrationBoundary>
    </Container>
  );
};

export default ProjectVersionsPage;
