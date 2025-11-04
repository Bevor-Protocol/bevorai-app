import { breadcrumbActions, securityAnalysisActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { Icon } from "@/components/ui/icon";
import { getQueryClient } from "@/lib/config/query";
import { QUERY_KEYS } from "@/utils/constants";
import { formatDate } from "@/utils/helpers";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Calendar, GitBranch } from "lucide-react";
import AnalysisClient, {
  AnalysisOptions,
  AnalysisUnlock,
  AnalysisUpdateMethod,
} from "./analysis-client";

interface PageProps {
  params: Promise<{ teamId: string; analysisId: string }>;
}

const AnalysisPage: AsyncComponent<PageProps> = async ({ params }) => {
  const queryClient = getQueryClient();
  const { teamId, analysisId } = await params;

  const [analysis, breadcrumb] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: [QUERY_KEYS.ANALYSES, analysisId],
      queryFn: async () => securityAnalysisActions.getSecurityAnalysis(teamId, analysisId),
    }),
    queryClient.fetchQuery({
      queryKey: [QUERY_KEYS.BREADCRUMBS, analysisId],
      queryFn: async () => breadcrumbActions.getSecurityAnalysisBreadcrumb(teamId, analysisId),
    }),
  ]);

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb
          breadcrumb={breadcrumb}
          toggle={<AnalysisOptions analysisId={analysisId} teamId={teamId} />}
        />
      }
    >
      <div className="flex flex-row items-center gap-2 justify-end max-w-5xl m-auto">
        <AnalysisUpdateMethod teamId={teamId} analysisId={analysisId} />
        <AnalysisUnlock teamId={teamId} analysisId={analysisId} />
      </div>
      <div className="max-w-5xl m-auto mt-8 lg:mt-16">
        <div className="flex flex-col gap-6 mb-8">
          <h1>{analysis.name}</h1>
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
        <HydrationBoundary state={dehydrate(queryClient)}>
          <AnalysisClient teamId={teamId} analysisId={analysisId} />
        </HydrationBoundary>
      </div>
    </Container>
  );
};

export default AnalysisPage;
