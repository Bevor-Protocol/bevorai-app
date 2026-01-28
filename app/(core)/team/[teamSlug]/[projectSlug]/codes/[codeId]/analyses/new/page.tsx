import { analysisActions, codeActions } from "@/actions/bevor";
import Container from "@/components/container";
import CodeVersionSubnav from "@/components/subnav/code-version";
import { getQueryClient } from "@/lib/config/query";
import { CodeProvider } from "@/providers/code";
import { generateQueryKey } from "@/utils/constants";
import { AnalysisNodeSchemaI, AsyncComponent, ScopeSchemaI } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import NewVersionClient from "./new-version-client";

type ResolvedParams = {
  teamSlug: string;
  projectSlug: string;
  codeId: string;
};

type Props = {
  params: Promise<ResolvedParams>;
  searchParams: Promise<{
    parentVersionId?: string;
  }>;
};

const AnalysisPage: AsyncComponent<Props> = async ({ params, searchParams }) => {
  const queryClient = getQueryClient();
  const resolvedParams = await params;
  const { parentVersionId } = await searchParams;

  let parentAnalysis: AnalysisNodeSchemaI | undefined;
  let parentScopes: ScopeSchemaI[] | undefined;

  if (parentVersionId) {
    [parentAnalysis, , parentScopes] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: generateQueryKey.analysis(parentVersionId),
        queryFn: () =>
          analysisActions.getAnalysis(resolvedParams.teamSlug, parentVersionId).then((r) => {
            if (!r.ok) throw r;
            return r.data;
          }),
      }),
      queryClient.fetchQuery({
        queryKey: generateQueryKey.code(resolvedParams.codeId),
        queryFn: () =>
          codeActions.getCodeVersion(resolvedParams.teamSlug, resolvedParams.codeId).then((r) => {
            if (!r.ok) throw r;
            return r.data;
          }),
      }),
      queryClient.fetchQuery({
        queryKey: generateQueryKey.analysisScopes(parentVersionId),
        queryFn: () =>
          analysisActions.getScopes(resolvedParams.teamSlug, parentVersionId).then((r) => {
            if (!r.ok) throw r;
            return r.data;
          }),
      }),
    ]);
  } else {
    await queryClient.fetchQuery({
      queryKey: generateQueryKey.code(resolvedParams.codeId),
      queryFn: () =>
        codeActions.getCodeVersion(resolvedParams.teamSlug, resolvedParams.codeId).then((r) => {
          if (!r.ok) throw r;
          return r.data;
        }),
    });
  }

  const sources = await queryClient.fetchQuery({
    queryKey: generateQueryKey.codeSources(resolvedParams.codeId),
    queryFn: () =>
      codeActions.getSources(resolvedParams.teamSlug, resolvedParams.codeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const initialSourceId = sources.length ? sources[0].id : null;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CodeProvider initialSourceId={initialSourceId} {...resolvedParams}>
        <Container subnav={<CodeVersionSubnav />} contain>
          <NewVersionClient
            {...resolvedParams}
            parentScopes={parentScopes ?? []}
            parentAnalysis={parentAnalysis}
          />
        </Container>
      </CodeProvider>
    </HydrationBoundary>
  );
};

export default AnalysisPage;
