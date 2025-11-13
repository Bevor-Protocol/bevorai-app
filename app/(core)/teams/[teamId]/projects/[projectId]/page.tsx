import { projectActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { getQueryClient } from "@/lib/config/query";
import { QUERY_KEYS } from "@/utils/constants";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import ProjectClient, { AnalysesPreview, ProjectActivities, ProjectToggle } from "./project-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ProjectPageProps {
  params: Promise<{ teamId: string; projectId: string }>;
}

const ProjectPage: AsyncComponent<ProjectPageProps> = async ({ params }) => {
  const queryClient = getQueryClient();
  const { teamId, projectId } = await params;

  queryClient.fetchQuery({
    queryKey: [QUERY_KEYS.PROJECTS, projectId],
    queryFn: async () => projectActions.getProject(teamId, projectId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Container
        breadcrumb={
          <ContainerBreadcrumb
            queryKey={[projectId]}
            queryType="project"
            teamId={teamId}
            id={projectId}
            toggle={<ProjectToggle teamId={teamId} projectId={projectId} />}
          />
        }
      >
        <div className="max-w-5xl m-auto mt-8 lg:mt-16">
          <div className="flex flex-col gap-6">
            <ProjectClient teamId={teamId} projectId={projectId} />
            <div className="flex flex-row justify-between gap-10">
              <div className="basis-1/2">
                <div>
                  <h3 className="my-6">Recent Analyses</h3>
                  <AnalysesPreview teamId={teamId} projectId={projectId} />
                </div>
              </div>
              <div className="basis-1/2 my-6">
                <ProjectActivities teamId={teamId} projectId={projectId} />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </HydrationBoundary>
  );
};

export default ProjectPage;
