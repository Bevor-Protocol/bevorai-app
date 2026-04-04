import { analysisActions, projectActions, userActions } from "@/actions/bevor";
import Container from "@/components/container";
import ProjectSubnav from "@/components/subnav/project";
import { getQueryClient } from "@/lib/config/query";
import { AsyncComponent } from "@/types";
import { FindingStatusEnum } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import ProjectClient, {
  AnalysesPreview,
  ProjectActivities,
  ValidatedFindings,
} from "./project-client";

interface ProjectPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string }>;
}

const ProjectPage: AsyncComponent<ProjectPageProps> = async ({ params }) => {
  const queryClient = getQueryClient();
  const { teamSlug, projectSlug } = await params;

  queryClient.fetchQuery({
    queryKey: generateQueryKey.project(projectSlug),
    queryFn: () =>
      projectActions.getProject(teamSlug, projectSlug).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  queryClient.prefetchQuery({
    queryKey: generateQueryKey.validatedFindings(projectSlug),
    queryFn: () =>
      analysisActions
        .getFindings(teamSlug, { project_slug: projectSlug, status: FindingStatusEnum.VALIDATED })
        .then((r) => {
          if (!r.ok) return [];
          return r.data;
        }),
  });

  const user = await queryClient.fetchQuery({
    queryKey: generateQueryKey.currentUser(),
    queryFn: () =>
      userActions.get().then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Container subnav={<ProjectSubnav />}>
        <div className="max-w-7xl mx-auto py-8">
          <ProjectClient teamSlug={teamSlug} projectSlug={projectSlug} />
          <div className="py-6 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
            <div className="min-w-0 space-y-8">
              <ValidatedFindings teamSlug={teamSlug} projectSlug={projectSlug} />
              <AnalysesPreview teamSlug={teamSlug} projectSlug={projectSlug} userId={user.id} />
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
