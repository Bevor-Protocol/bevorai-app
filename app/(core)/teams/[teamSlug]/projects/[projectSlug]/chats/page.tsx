import { bevorAction } from "@/actions";
import Container from "@/components/container";
import { navigation } from "@/utils/navigation";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { ChatGrid } from "./chat-grid";
import { ChatPagination } from "./chat-pagination";

interface ChatsPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const ChatsPage: AsyncComponent<ChatsPageProps> = async ({ params, searchParams }) => {
  const { teamSlug, projectSlug } = await params;
  const project = await bevorAction.getProjectBySlug(projectSlug);
  const { page = "0" } = await searchParams;

  const query = { page, project_id: project.id };

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["chats", query],
    queryFn: () => bevorAction.getChats(query),
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
            basePath={navigation.project.chats({ teamSlug, projectSlug })}
            page={page}
          />
        </HydrationBoundary>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ChatGrid query={query} />
        </HydrationBoundary>
      </div>
    </Container>
  );
};

export default ChatsPage;
