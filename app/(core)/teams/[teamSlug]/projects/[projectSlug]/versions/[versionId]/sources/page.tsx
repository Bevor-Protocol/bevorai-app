import { bevorAction } from "@/actions";
import { AsyncComponent } from "@/utils/types";
import SourcesViewer from "./sources-viewer";

type Props = {
  params: Promise<{ versionId: string }>;
};

const SourcesPage: AsyncComponent<Props> = async ({ params }) => {
  const { versionId } = await params;
  const version = await bevorAction.getContractVersion(versionId);
  const sources = await bevorAction.getContractVersionSources(versionId);

  return <SourcesViewer version={version} sources={sources} />;
};

export default SourcesPage;
