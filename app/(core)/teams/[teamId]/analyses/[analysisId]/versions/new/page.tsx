import { analysisActions, versionActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { CodeProvider } from "@/providers/code";
import { AsyncComponent } from "@/utils/types";
import { redirect } from "next/navigation";
import NewVersionClient from "./new-version-client";

type ResolvedParams = {
  teamId: string;
  analysisId: string;
};

type Props = {
  params: Promise<ResolvedParams>;
};

const AnalysisPage: AsyncComponent<Props> = async ({ params }) => {
  const resolvedParams = await params;
  const analysis = await analysisActions.getAnalysis(
    resolvedParams.teamId,
    resolvedParams.analysisId,
  );
  if (!analysis.head.code_version_id) {
    redirect(`/teams/${resolvedParams.teamId}/analysis/${resolvedParams.analysisId}`);
  }

  const tree = await versionActions.getTree(resolvedParams.teamId, analysis.head.code_version_id);

  return (
    <CodeProvider
      initialSourceId={tree.length ? tree[0].id : null}
      teamId={resolvedParams.teamId}
      versionId={analysis.head.code_version_id}
    >
      <Container
        breadcrumb={
          <ContainerBreadcrumb
            queryKey={[resolvedParams.analysisId]}
            queryType="analysis"
            teamId={resolvedParams.teamId}
            id={resolvedParams.analysisId}
          />
        }
        className="pt-0"
      >
        <NewVersionClient tree={tree} teamId={resolvedParams.teamId} analysis={analysis} />
      </Container>
    </CodeProvider>
  );
};

export default AnalysisPage;
