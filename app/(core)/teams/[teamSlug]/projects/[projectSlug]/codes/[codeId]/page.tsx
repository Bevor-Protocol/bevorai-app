"use server";

import { codeActions, dashboardActions } from "@/actions/bevor";
import CodeMetadata from "@/app/(core)/teams/[teamSlug]/projects/[projectSlug]/codes/[codeId]/metadata";
import SourcesViewer from "@/app/(core)/teams/[teamSlug]/projects/[projectSlug]/codes/[codeId]/sources-viewer";
import Container from "@/components/container";
import CodeVersionSubnav from "@/components/subnav/code-version";
import { CodeProvider } from "@/providers/code";
import { extractAnalysisThreadsQuery } from "@/utils/query-params";
import { AsyncComponent } from "@/utils/types";

type ResolvedParams = {
  codeId: string;
  projectSlug: string;
  teamSlug: string;
};

type Props = {
  params: Promise<ResolvedParams>;
};

const SourcesPage: AsyncComponent<Props> = async ({ params }) => {
  const resolvedParams = await params;

  const [version, tree, user] = await Promise.all([
    codeActions.getCodeVersion(resolvedParams.teamSlug, resolvedParams.codeId),
    codeActions.getTree(resolvedParams.teamSlug, resolvedParams.codeId),
    dashboardActions.getUser(),
  ]);

  const analysisQuery = extractAnalysisThreadsQuery({
    project_slug: resolvedParams.projectSlug,
    user_id: user?.id ?? "",
  });

  return (
    <CodeProvider initialSourceId={tree.length ? tree[0].id : null} {...resolvedParams}>
      <Container subnav={<CodeVersionSubnav />}>
        <CodeMetadata
          teamSlug={resolvedParams.teamSlug}
          projectSlug={resolvedParams.projectSlug}
          analysisQuery={analysisQuery}
          version={version}
        />
        <SourcesViewer tree={tree} teamSlug={resolvedParams.teamSlug} codeId={version.id} />
      </Container>
    </CodeProvider>
  );
};

export default SourcesPage;
