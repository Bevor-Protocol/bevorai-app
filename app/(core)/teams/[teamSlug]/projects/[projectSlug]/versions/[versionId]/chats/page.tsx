import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { NewChatButton } from "./chat-client";
import { ChatGrid } from "./chat-grid";
import { ChatPagination } from "./chat-pagination";

interface ChatsPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string; versionId: string }>;
  searchParams: Promise<{ page?: string }>;
}

const ChatsPage: AsyncComponent<ChatsPageProps> = async ({ params, searchParams }) => {
  const { teamSlug, projectSlug, versionId } = await params;
  const { page = "0" } = await searchParams;

  const query = { page, version_id: versionId };

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["chats", query],
    queryFn: () => bevorAction.getChats(query),
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Chat History</h1>
          <p className="text-neutral-400 mt-1">
            View and continue your conversations about this version
          </p>
        </div>
        <NewChatButton versionId={versionId} teamSlug={teamSlug} projectSlug={projectSlug} />
      </div>

      <div className="space-y-6">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ChatPagination
            basePath={`/teams/${teamSlug}/projects/${projectSlug}/versions/${versionId}/chats`}
            page={page}
          />
        </HydrationBoundary>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ChatGrid
            teamSlug={teamSlug}
            projectSlug={projectSlug}
            versionId={versionId}
            query={query}
          />
        </HydrationBoundary>
      </div>
    </div>
  );
};

export default ChatsPage;
