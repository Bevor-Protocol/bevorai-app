import { analysisActions, chatActions } from "@/actions/bevor";
import Container from "@/components/container";
import ChatSubnav from "@/components/subnav/chat";
import AnalysisHolder from "@/components/views/analysis/holder";
import AnalysisMetadata from "@/components/views/analysis/metadata";
import { getQueryClient } from "@/lib/config/query";
import { generateQueryKey } from "@/utils/constants";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

type ResolvedParams = {
  chatId: string;
  teamSlug: string;
  projectSlug: string;
};

type Props = {
  params: Promise<ResolvedParams>;
};

const SourcesPage: AsyncComponent<Props> = async ({ params }) => {
  const queryClient = getQueryClient();
  const resolvedParams = await params;

  const chat = await chatActions.getChat(resolvedParams.teamSlug, resolvedParams.chatId);

  if (!chat.analysis_node_id) {
    return (
      <Container subnav={<ChatSubnav />}>
        <div className="size-full flex justify-center items-center">
          This chat is not associated with an analysis.
        </div>
      </Container>
    );
  }

  await queryClient.fetchQuery({
    queryKey: generateQueryKey.analysisDetailed(chat.analysis_node_id),
    queryFn: () =>
      analysisActions.getAnalysisDetailed(resolvedParams.teamSlug, chat.analysis_node_id!),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Container subnav={<ChatSubnav />}>
        <AnalysisMetadata {...resolvedParams} nodeId={chat.analysis_node_id} isEditMode={false} />
        <AnalysisHolder {...resolvedParams} nodeId={chat.analysis_node_id} />
      </Container>
    </HydrationBoundary>
  );
};

export default SourcesPage;
