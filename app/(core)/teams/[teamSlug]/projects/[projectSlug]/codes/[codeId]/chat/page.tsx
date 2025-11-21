import { chatActions } from "@/actions/bevor";
import Container from "@/components/container";
import CodeVersionSubnav from "@/components/subnav/code-version";
import { getQueryClient } from "@/lib/config/query";
import { generateQueryKey } from "@/utils/constants";
import { extractChatsQuery } from "@/utils/query-params";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import ChatClient from "./chat-client";

type ResolvedParams = {
  teamSlug: string;
  projectSlug: string;
  codeId: string;
};

interface ChatsPageProps {
  params: Promise<ResolvedParams>;
}

const ChatsPage: AsyncComponent<ChatsPageProps> = async ({ params }) => {
  const queryClient = getQueryClient();
  const resolvedParams = await params;

  const chatQuery = extractChatsQuery({
    project_slug: resolvedParams.projectSlug,
    code_mapping_id: resolvedParams.codeId,
  });

  const chats = await queryClient.fetchQuery({
    queryKey: generateQueryKey.chats(resolvedParams.teamSlug, chatQuery),
    queryFn: () => chatActions.getChats(resolvedParams.teamSlug, chatQuery),
  });

  const defaultChat = chats.results.length ? chats.results[0] : null;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Container subnav={<CodeVersionSubnav />} className="flex flex-col min-h-0">
        <ChatClient {...resolvedParams} defaultChat={defaultChat} query={chatQuery} />
      </Container>
    </HydrationBoundary>
  );
};

export default ChatsPage;
