import { analysisActions, codeActions } from "@/actions/bevor";
import { getQueryClient } from "@/lib/config/query";
import { AsyncComponent } from "@/types";
import { generateQueryKey } from "@/utils/constants";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import ProcessingClient from "./processing-client";

type ResolvedParams = {
  teamSlug: string;
  projectSlug: string;
  nodeId: string;
};

type Props = {
  params: Promise<ResolvedParams>;
};

const AnalysisProcessingPage: AsyncComponent<Props> = async ({ params }) => {
  const queryClient = getQueryClient();
  const resolved = await params;
  const analysisId = resolved.nodeId;

  const analysis = await queryClient.fetchQuery({
    queryKey: generateQueryKey.analysis(analysisId),
    queryFn: () =>
      analysisActions.getAnalysis(resolved.teamSlug, analysisId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const codeVersionId = analysis.code_version_id;

  await Promise.all([
    queryClient.fetchQuery({
      queryKey: generateQueryKey.code(codeVersionId),
      queryFn: () =>
        codeActions.getCodeVersion(resolved.teamSlug, codeVersionId).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.analysisScopes(analysisId),
      queryFn: () =>
        analysisActions.getScopes(resolved.teamSlug, analysisId).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
    queryClient.fetchQuery({
      queryKey: generateQueryKey.analysisFindings(analysisId),
      queryFn: () =>
        analysisActions.getAnalysisFindings(resolved.teamSlug, analysisId).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProcessingClient
        teamSlug={resolved.teamSlug}
        projectSlug={resolved.projectSlug}
        analysisId={analysisId}
      />
    </HydrationBoundary>
  );
};

export default AnalysisProcessingPage;
