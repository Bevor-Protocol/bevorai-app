import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import { ChatInterface } from "./chat-interface";

type ResolvedParams = {
  teamId: string;
  chatId: string;
};

interface ChatPageProps {
  params: Promise<ResolvedParams>;
}

const ChatPage: AsyncComponent<ChatPageProps> = async ({ params }) => {
  const resolvedParams = await params;

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb
          queryKey={[resolvedParams.chatId]}
          queryType="chat"
          teamId={resolvedParams.teamId}
          id={resolvedParams.chatId}
        />
      }
      className="flex flex-col"
    >
      <div className="flex flex-col bg-background max-w-3xl m-auto grow min-h-0 w-full">
        <ChatInterface {...resolvedParams} />
      </div>
    </Container>
  );
};

export default ChatPage;
