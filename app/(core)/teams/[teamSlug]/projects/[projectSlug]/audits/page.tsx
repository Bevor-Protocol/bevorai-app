import { bevorAction } from "@/actions";
import { ProjectHeader } from "@/app/(core)/teams/[teamSlug]/projects/[projectSlug]/header";
import { AuditGrid } from "@/components/audits/grid";
import { AuditPagination } from "@/components/audits/pagination";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

interface ProjectAuditsPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string; versionId: string }>;
  searchParams: Promise<{ page?: string }>;
}

const ProjectAuditsPage: AsyncComponent<ProjectAuditsPageProps> = async ({
  params,
  searchParams,
}) => {
  const { teamSlug, projectSlug } = await params;
  const { page = "0" } = await searchParams;

  const project = await bevorAction.getProjectBySlug(projectSlug);

  const query = { page, project_id: project.id };

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["audits", query],
    queryFn: () => bevorAction.getAudits(query),
  });

  return (
    <div className="max-w-6xl m-auto">
      <ProjectHeader teamSlug={teamSlug} projectSlug={projectSlug} />
      <div className="space-y-6">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <AuditPagination
            basePath={`/teams/${teamSlug}/projects/${projectSlug}/audits`}
            page={page}
          />
        </HydrationBoundary>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <AuditGrid teamSlug={teamSlug} query={query} />
        </HydrationBoundary>
      </div>
    </div>
  );
};

export default ProjectAuditsPage;
