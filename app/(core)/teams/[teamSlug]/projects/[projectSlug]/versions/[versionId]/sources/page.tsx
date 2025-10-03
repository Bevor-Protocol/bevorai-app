import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import ChatPanel from "./chat-panel";
import SourcesViewer from "./sources-viewer";

type Props = {
  params: Promise<{ versionId: string; teamSlug: string; projectSlug: string }>;
};

const SourcesPage: AsyncComponent<Props> = async ({ params }) => {
  const { versionId, teamSlug, projectSlug } = await params;
  const version = await bevorAction.getContractVersion(versionId);
  const sources = await bevorAction.getContractVersionSources(versionId);

  return (
    <div className="flex flex-row justify-between">
      <SourcesViewer version={version} sources={sources} />
      <ChatPanel versionId={versionId} teamSlug={teamSlug} projectSlug={projectSlug} />
    </div>
  );
};

export default SourcesPage;
