import { AsyncComponent } from "@/utils/types";
import { bevorAction } from "@/actions";
import React from "react";
import SourcesViewer from "./sources-viewer";

type Props = {
  params: Promise<{ versionId: string }>;
};

const SourcesPage: AsyncComponent<Props> = async ({ params }) => {
  const { versionId } = await params;
  const version = await bevorAction.getContractVersion(versionId);
  const sources = await bevorAction.getContractVersionSources(versionId);

  return (
    <div className="px-6 py-4 bg-neutral-950 fill-remaining-height">
      <SourcesViewer version={version} sources={sources} />
    </div>
  );
};

export default SourcesPage;
