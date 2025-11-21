import { projectActions } from "@/actions/bevor";
import Container from "@/components/container";
import ProjectSubnav from "@/components/subnav/project";
import { getQueryClient } from "@/lib/config/query";
import { generateQueryKey } from "@/utils/constants";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import ProjectClient, { AnalysesPreview, ProjectActivities } from "./project-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ProjectPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string }>;
}

const ProjectPage: AsyncComponent<ProjectPageProps> = async ({ params }) => {
  const queryClient = getQueryClient();
  const { teamSlug, projectSlug } = await params;

  queryClient.fetchQuery({
    queryKey: generateQueryKey.project(projectSlug),
    queryFn: async () => projectActions.getProject(teamSlug, projectSlug),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Container subnav={<ProjectSubnav />}>
        <div className="max-w-7xl mx-auto py-8">
          <ProjectClient teamSlug={teamSlug} projectSlug={projectSlug} />
          <div className="py-6 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
            <div className="min-w-0 space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Analysis Threads</h3>
                <AnalysesPreview teamSlug={teamSlug} projectSlug={projectSlug} />
              </div>
            </div>
            <div className="min-w-0">
              <ProjectActivities teamSlug={teamSlug} projectSlug={projectSlug} />
            </div>
          </div>
        </div>
      </Container>
    </HydrationBoundary>
  );
};

export default ProjectPage;
