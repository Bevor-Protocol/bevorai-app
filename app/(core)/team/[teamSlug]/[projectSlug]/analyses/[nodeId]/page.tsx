import { analysisActions } from "@/actions/bevor";
import Container from "@/components/container";
import AnalysisSubnav from "@/components/subnav/analysis";
import AnalysisHolder from "@/components/views/analysis/holder";
import AnalysisMetadata from "@/components/views/analysis/metadata";
import { getQueryClient } from "@/lib/config/query";
import { generateQueryKey } from "@/utils/constants";
import { AnalysisNodeSchemaI, AsyncComponent, FindingSchemaI } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { EditClient } from "./edit-mode";

type ResolvedParams = {
  nodeId: string;
  teamSlug: string;
  projectSlug: string;
};

type Props = {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{ mode?: string; findingId?: string }>;
};

const AnalysisPage: AsyncComponent<Props> = async ({ params, searchParams }) => {
  const queryClient = getQueryClient();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const isEditMode = resolvedSearchParams.mode === "edit";
  let analysis: AnalysisNodeSchemaI;
  let initialFinding: FindingSchemaI | undefined;

  if (isEditMode) {
    [, analysis] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: generateQueryKey.analysisDraft(resolvedParams.nodeId),
        queryFn: () =>
          analysisActions.getDraft(resolvedParams.teamSlug, resolvedParams.nodeId).then((r) => {
            if (!r.ok) throw r;
            return r.data;
          }),
      }),
      queryClient.fetchQuery({
        queryKey: generateQueryKey.analysisDetailed(resolvedParams.nodeId),
        queryFn: () =>
          analysisActions
            .getAnalysisDetailed(resolvedParams.teamSlug, resolvedParams.nodeId)
            .then((r) => {
              if (!r.ok) throw r;
              return r.data;
            }),
      }),
    ]);
  } else {
    analysis = await queryClient.fetchQuery({
      queryKey: generateQueryKey.analysisDetailed(resolvedParams.nodeId),
      queryFn: async () =>
        analysisActions
          .getAnalysisDetailed(resolvedParams.teamSlug, resolvedParams.nodeId)
          .then((r) => {
            if (!r.ok) throw r;
            return r.data;
          }),
    });
  }

  if (!isEditMode && resolvedSearchParams.findingId) {
    initialFinding = analysis.findings.find(
      (finding) => finding.id === resolvedSearchParams.findingId,
    );
  }

  if (isEditMode && !analysis.is_owner) {
    // non-owners should not be allowed to edit, strip out the query param.
    let url = `/team/${resolvedParams.teamSlug}/${resolvedParams.projectSlug}/analyses/${resolvedParams.nodeId}`;
    if (resolvedSearchParams.findingId) {
      url += `?findingId=${resolvedSearchParams.findingId}`;
    }
    redirect(url);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Container subnav={<AnalysisSubnav />}>
        <AnalysisMetadata
          {...resolvedParams}
          isEditMode={isEditMode}
          allowChat={analysis.is_owner}
          allowEditMode={analysis.is_owner}
          allowActions
          isOwner={analysis.is_owner}
        />
        {isEditMode ? (
          <EditClient
            teamSlug={resolvedParams.teamSlug}
            nodeId={resolvedParams.nodeId}
            projectSlug={resolvedParams.projectSlug}
          />
        ) : (
          <AnalysisHolder {...resolvedParams} initialFinding={initialFinding} />
        )}
      </Container>
    </HydrationBoundary>
  );
};

export default AnalysisPage;
