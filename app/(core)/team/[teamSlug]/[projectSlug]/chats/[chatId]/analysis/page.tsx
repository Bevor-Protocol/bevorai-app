import { analysisActions, chatActions } from "@/actions/bevor";
import AnalysisNodeMetadata from "@/app/(core)/team/[teamSlug]/[projectSlug]/analyses/[nodeId]/metadata";
import Container from "@/components/container";
import ChatSubnav from "@/components/subnav/chat";
import { AsyncComponent } from "@/utils/types";
import { AnalysisVersionClient } from "./analysis-version-client";

type ResolvedParams = {
  chatId: string;
  teamSlug: string;
  projectSlug: string;
};

type Props = {
  params: Promise<ResolvedParams>;
};

const SourcesPage: AsyncComponent<Props> = async ({ params }) => {
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

  const analysisVersion = await analysisActions.getAnalysisVersion(
    resolvedParams.teamSlug,
    chat.analysis_node_id,
  );

  return (
    <Container subnav={<ChatSubnav />}>
      <AnalysisNodeMetadata
        {...resolvedParams}
        version={analysisVersion}
        isEditMode={false}
        allowEditMode={false}
      />
      <AnalysisVersionClient
        {...resolvedParams}
        analysisVersion={analysisVersion}
        nodeId={chat.analysis_node_id}
      />
    </Container>
  );
};

export default SourcesPage;
