import { analysisActions, chatActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { getQueryClient } from "@/lib/config/query";
import { generateQueryKey } from "@/utils/constants";
import { extractAnalysisChatsQuery } from "@/utils/queries";
import { AsyncComponent } from "@/utils/types";
import ChatClient from "./chat-client";

type ResolvedParams = {
  teamSlug: string;
  analysisId: string;
};

interface ChatsPageProps {
  params: Promise<ResolvedParams>;
}

const ChatsPage: AsyncComponent<ChatsPageProps> = async ({ params }) => {
  const queryClient = getQueryClient();
  const resolvedParams = await params;

  const chatQuery = extractAnalysisChatsQuery(resolvedParams.analysisId, {
    page_size: "1",
    page: "0",
  });

  const [analysis, chats] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: generateQueryKey.analysis(resolvedParams.analysisId),
      queryFn: () =>
        analysisActions.getAnalysis(resolvedParams.teamSlug, resolvedParams.analysisId),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.chats(resolvedParams.teamSlug, chatQuery),
      queryFn: () => chatActions.getChats(resolvedParams.teamSlug, chatQuery),
    }),
  ]);

  const defaultChat = chats.results.length ? chats.results[0] : null;

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb
          queryKey={[resolvedParams.analysisId]}
          queryType="analysis-chat"
          teamSlug={resolvedParams.teamSlug}
          id={resolvedParams.analysisId}
        />
      }
      className="flex flex-col"
    >
      <ChatClient {...resolvedParams} projectSlug={analysis.project_id} defaultChat={defaultChat} />
    </Container>
  );
};

export default ChatsPage;
