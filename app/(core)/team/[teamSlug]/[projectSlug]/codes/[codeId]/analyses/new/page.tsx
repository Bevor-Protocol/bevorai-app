import { analysisActions, codeActions } from "@/actions/bevor";
import Container from "@/components/container";
import CodeVersionSubnav from "@/components/subnav/code-version";
import { getQueryClient } from "@/lib/config/query";
import { CodeProvider } from "@/providers/code";
import { AsyncComponent } from "@/types";
import { AnalysisNodeSchema, ScopeSchema } from "@/types/api/responses/security";
import { generateQueryKey } from "@/utils/constants";
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

  let parentAnalysis: AnalysisNodeSchema | undefined;
  let parentScopes: ScopeSchema[] | undefined;

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
    queryKey: generateQueryKey.codeFiles(resolvedParams.codeId),
    queryFn: () =>
      codeActions.getFiles(resolvedParams.teamSlug, resolvedParams.codeId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const initialFileId = sources.length ? sources[0].id : null;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CodeProvider initialFileId={initialFileId} {...resolvedParams}>
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
