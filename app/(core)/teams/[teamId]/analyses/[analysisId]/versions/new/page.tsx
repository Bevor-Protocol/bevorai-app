import { breadcrumbActions, securityAnalysisActions, versionActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getQueryClient } from "@/lib/config/query";
import { QUERY_KEYS } from "@/utils/constants";
import { AsyncComponent } from "@/utils/types";
import { redirect } from "next/navigation";
import NewVersionClient from "./new-version-client";

type Props = {
  params: Promise<{ teamId: string; analysisId: string }>;
};

const AnalysisPage: AsyncComponent<Props> = async ({ params }) => {
  const queryClient = getQueryClient();
  const { teamId, analysisId } = await params;
  const analysis = await securityAnalysisActions.getSecurityAnalysis(teamId, analysisId);
  if (!analysis.current_code_head) {
    redirect(`/teams/${teamId}/analysis/${analysisId}`);
  }

  let tree = [];
  if (analysis.current_security_head) {
    tree = await securityAnalysisActions.getScope(teamId, analysis.current_security_head.id);
  } else {
    tree = await versionActions.getTree(teamId, analysis.current_code_head.id);
  }

  const breadcrumb = await queryClient.fetchQuery({
    queryKey: [QUERY_KEYS.BREADCRUMBS, analysisId],
    queryFn: () => breadcrumbActions.getSecurityAnalysisVersionsBreadcrumb(teamId, analysisId),
  });

  return (
    <Container breadcrumb={<ContainerBreadcrumb breadcrumb={breadcrumb} />}>
      <ScrollArea className="h-[calc(100svh-(42px+3rem+1rem))] pr-2">
        <h3>Analysis Scope</h3>
        <p className="text-muted-foreground leading-[1.5] my-4">
          Select which functions you want to be within scope of this analysis. If no scope is
          selected, all auditable functions will be included. An auditable function is one that is
          considered an entry point, meaning its externally callable. Other children functions will
          automatically be included if they are part of the call chain.
        </p>
        <NewVersionClient tree={tree} teamId={teamId} analysis={analysis} />
      </ScrollArea>
    </Container>
  );
};

export default AnalysisPage;
