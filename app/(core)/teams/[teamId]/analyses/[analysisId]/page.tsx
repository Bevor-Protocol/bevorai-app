"use server";

import { analysisActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { Icon } from "@/components/ui/icon";
import { getQueryClient } from "@/lib/config/query";
import { QUERY_KEYS } from "@/utils/constants";
import { formatDate } from "@/utils/helpers";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Calendar, GitBranch } from "lucide-react";
import {
  AnalysisChat,
  AnalysisCodeHead,
  AnalysisOptions,
  AnalysisSecurityHead,
  AnalysisUnlock,
  AnalysisUpdateMethod,
} from "./analysis-client";

interface ResolvedParams {
  teamId: string;
  analysisId: string;
}

interface PageProps {
  params: Promise<ResolvedParams>;
}

const AnalysisPage: AsyncComponent<PageProps> = async ({ params }) => {
  const queryClient = getQueryClient();
  const resolvedParams = await params;
  const { teamId, analysisId } = resolvedParams;

  const analysis = await queryClient.fetchQuery({
    queryKey: [QUERY_KEYS.ANALYSES, analysisId],
    queryFn: () => analysisActions.getAnalysis(teamId, analysisId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Container
        breadcrumb={
          <ContainerBreadcrumb
            queryKey={[analysisId]}
            queryType="analysis"
            teamId={teamId}
            id={analysisId}
            toggle={<AnalysisOptions teamId={teamId} analysisId={analysisId} />}
          />
        }
      >
        <div className="flex flex-row items-center gap-2 justify-end max-w-5xl m-auto">
          <AnalysisUpdateMethod teamId={teamId} analysisId={analysisId} />
          <AnalysisUnlock teamId={teamId} analysisId={analysisId} />
        </div>
        <div className="max-w-5xl m-auto mt-8 lg:mt-16">
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex justify-between items-start">
              <h1>{analysis.name}</h1>

              <AnalysisChat {...resolvedParams} />
            </div>
            <div className="flex flex-row gap-2 items-center">
              <div className="text-muted-foreground">Owner:</div>
              <Icon size="sm" seed={analysis.user.id} />
              <div>{analysis.user.username}</div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <Calendar className="size-4" />
                <span>{formatDate(analysis.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <GitBranch className="size-4" />
                <span>{analysis.n_versions} versions</span>
              </div>
            </div>
            {analysis.description && (
              <div className="my-2">
                <p className="text-lg leading-relaxed">{analysis.description}</p>
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Current Code Version</h3>
                </div>
                <AnalysisCodeHead {...resolvedParams} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Current Security Version</h3>
                </div>
                <AnalysisSecurityHead {...resolvedParams} />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </HydrationBoundary>
  );
};

export default AnalysisPage;
