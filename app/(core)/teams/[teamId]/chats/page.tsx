import { chatActions } from "@/actions/bevor";

import { projectActions } from "@/actions/bevor";
import Container from "@/components/container";
import { QUERY_KEYS } from "@/utils/constants";
import { navigation } from "@/utils/navigation";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { ChatGrid } from "./chat-grid";
import { ChatPagination } from "./chat-pagination";

interface ChatsPageProps {
  params: Promise<{ teamId: string; projectId: string }>;
  searchParams: Promise<{ page?: string }>;
}

const ChatsPage: AsyncComponent<ChatsPageProps> = async ({ params, searchParams }) => {
  const { teamId, projectId } = await params;
  const project = await projectActions.getProject(teamId, projectId);
  const { page = "0" } = await searchParams;

  const query = { page, project_id: project.id };

  const queryClient = new QueryClient();
  await queryClient.fetchQuery({
    queryKey: [QUERY_KEYS.CHATS, teamId, query],
    queryFn: () => chatActions.getChats(teamId, query),
  });

  return (
    <Container>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chat History</h1>
          <p className="text-muted-foreground mt-1">
            View and continue your conversations about this version
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ChatPagination
            basePath={navigation.project.chats({ teamId, projectId })}
            page={page}
            teamId={teamId}
          />
        </HydrationBoundary>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ChatGrid query={query} teamId={teamId} />
        </HydrationBoundary>
      </div>
    </Container>
  );
};

export default ChatsPage;
