import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { AsyncComponent } from "@/utils/types";
import ChatClient from "./chat-client";

type ResolvedParams = {
  teamId: string;
  analysisId: string;
};

interface ChatsPageProps {
  params: Promise<ResolvedParams>;
}

const ChatsPage: AsyncComponent<ChatsPageProps> = async ({ params }) => {
  const resolvedParams = await params;

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb
          queryKey={[resolvedParams.analysisId]}
          queryType="analysis-chat"
          teamId={resolvedParams.teamId}
          id={resolvedParams.analysisId}
        />
      }
      className="flex flex-col"
    >
      <ChatClient {...resolvedParams} />
    </Container>
  );
};

export default ChatsPage;
