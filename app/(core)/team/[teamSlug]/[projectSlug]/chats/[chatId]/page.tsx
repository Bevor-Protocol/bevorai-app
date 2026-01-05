import { chatActions } from "@/actions/bevor";
import Container from "@/components/container";
import ChatSubnav from "@/components/subnav/chat";
import { getQueryClient } from "@/lib/config/query";
import { generateQueryKey } from "@/utils/constants";
import { extractChatsQuery } from "@/utils/query-params";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import ChatClient from "./chat-client";

type ResolvedParams = {
  teamSlug: string;
  projectSlug: string;
  chatId: string;
};

interface ChatsPageProps {
  params: Promise<ResolvedParams>;
}

const ChatsPage: AsyncComponent<ChatsPageProps> = async ({ params }) => {
  const queryClient = getQueryClient();
  const resolvedParams = await params;

  const chatQuery = extractChatsQuery({
    project_slug: resolvedParams.projectSlug,
  });

  await Promise.all([
    queryClient.fetchQuery({
      queryKey: generateQueryKey.chats(resolvedParams.teamSlug, chatQuery),
      queryFn: () =>
        chatActions.getChats(resolvedParams.teamSlug, chatQuery).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.chat(resolvedParams.chatId),
      queryFn: () =>
        chatActions.getChat(resolvedParams.teamSlug, resolvedParams.chatId).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Container subnav={<ChatSubnav />} contain>
        <ChatClient {...resolvedParams} query={chatQuery} />
      </Container>
    </HydrationBoundary>
  );
};

export default ChatsPage;
