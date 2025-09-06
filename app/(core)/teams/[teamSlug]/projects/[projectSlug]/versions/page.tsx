import { bevorAction } from "@/actions";
import { ProjectHeader } from "@/app/(core)/teams/[teamSlug]/projects/[projectSlug]/header";
import { VersionGrid } from "@/components/versions/grid";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

interface ProjectPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string }>;
}

const ProjectVersionsPage: AsyncComponent<ProjectPageProps> = async ({ params }) => {
  const { teamSlug, projectSlug } = await params;

  const project = await bevorAction.getProjectBySlug(projectSlug);
  const query = { page_size: "9", project_id: project.id };

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["versions", query],
    queryFn: () => bevorAction.getVersions(query),
  });

  return (
    <div className="max-w-6xl m-auto">
      <ProjectHeader teamSlug={teamSlug} projectSlug={projectSlug} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <VersionGrid teamSlug={teamSlug} query={query} />
      </HydrationBoundary>
    </div>
  );
};

export default ProjectVersionsPage;
