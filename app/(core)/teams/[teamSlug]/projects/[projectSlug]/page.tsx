import { projectActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { getQueryClient } from "@/lib/config/query";
import { generateQueryKey } from "@/utils/constants";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import ProjectClient, { AnalysesPreview, ProjectActivities, ProjectToggle } from "./project-client";

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
      <Container
        breadcrumb={
          <ContainerBreadcrumb
            queryKey={[projectSlug]}
            queryType="project"
            teamSlug={teamSlug}
            id={projectSlug}
            toggle={<ProjectToggle teamSlug={teamSlug} projectSlug={projectSlug} />}
          />
        }
      >
        <div className="max-w-5xl m-auto mt-8 lg:mt-16">
          <div className="flex flex-col gap-6">
            <ProjectClient teamSlug={teamSlug} projectSlug={projectSlug} />
            <div className="flex flex-row justify-between gap-10">
              <div className="basis-1/2">
                <div>
                  <h3 className="my-6">Recent Analysis Threads</h3>
                  <AnalysesPreview teamSlug={teamSlug} projectSlug={projectSlug} />
                </div>
              </div>
              <div className="basis-1/2 my-6">
                <ProjectActivities teamSlug={teamSlug} projectSlug={projectSlug} />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </HydrationBoundary>
  );
};

export default ProjectPage;
