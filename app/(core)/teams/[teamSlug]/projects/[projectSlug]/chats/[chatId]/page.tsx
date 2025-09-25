import { bevorAction } from "@/actions";
import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { ChatInterface } from "./chat-interface";

interface ChatPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string; chatId: string }>;
}

const ChatPage: AsyncComponent<ChatPageProps> = async ({ params }) => {
  const { teamSlug, projectSlug, chatId } = await params;

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["chat", chatId],
    queryFn: () => bevorAction.getChat(chatId),
  });

  return (
    <Container constrainHeight>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ChatInterface chatId={chatId} teamSlug={teamSlug} projectSlug={projectSlug} />
      </HydrationBoundary>
    </Container>
  );
};

export default ChatPage;
