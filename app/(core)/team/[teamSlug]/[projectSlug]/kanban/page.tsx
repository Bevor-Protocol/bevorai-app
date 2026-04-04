import { analysisActions, projectActions, userActions } from "@/actions/bevor";
import Container from "@/components/container";
import ProjectSubnav from "@/components/subnav/project";
import { getQueryClient } from "@/lib/config/query";
import { AsyncComponent } from "@/types";
import { generateQueryKey } from "@/utils/constants";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import KanbanBoard from "./kanban-board";

interface ProjectPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string }>;
}

const KanbanPage: AsyncComponent<ProjectPageProps> = async ({ params }) => {
  const queryClient = getQueryClient();
  const { teamSlug, projectSlug } = await params;

  const [project, userRes] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: generateQueryKey.project(projectSlug),
      queryFn: async () =>
        projectActions.getProject(teamSlug, projectSlug).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
    userActions.get(),
  ]);

  const currentUserId = userRes.ok ? userRes.data.id : "";

  const kanbanRes = await analysisActions.getKanban(teamSlug, project.id).then((r) => {
    if (!r.ok) throw r;
    return r.data;
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Container subnav={<ProjectSubnav />}>
        <div className="max-w-7xl mx-auto py-8">
          <KanbanBoard
            findings={kanbanRes}
            teamSlug={teamSlug}
            projectSlug={projectSlug}
            currentUserId={currentUserId}
          />
        </div>
      </Container>
    </HydrationBoundary>
  );
};

export default KanbanPage;
