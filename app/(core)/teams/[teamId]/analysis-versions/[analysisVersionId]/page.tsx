import { analysisActions } from "@/actions/bevor";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/utils/helpers";
import { AsyncComponent } from "@/utils/types";
import { Calendar, Clock, Shield, Users } from "lucide-react";
import { AnalysisVersionClient, Relations } from "./analysis-version-client";

type ResolvedParams = {
  analysisVersionId: string;
  teamId: string;
};

type Props = {
  params: Promise<ResolvedParams>;
};

const getTriggerIcon = (trigger: string): React.ReactElement => {
  switch (trigger) {
    case "manual_run":
      return <Users className="size-4" />;
    case "chat":
      return <Shield className="size-4" />;
    case "forked":
      return <Clock className="size-4" />;
    case "manual_edit":
      return <Users className="size-4" />;
    default:
      return <Shield className="size-4" />;
  }
};

const SourcesPage: AsyncComponent<Props> = async ({ params }) => {
  const resolvedParams = await params;

  const analysisVersion = await analysisActions.getAnalysisVersion(
    resolvedParams.teamId,
    resolvedParams.analysisVersionId,
  );

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb
          queryKey={[resolvedParams.analysisVersionId]}
          queryType="analysis-version"
          teamId={resolvedParams.teamId}
          id={resolvedParams.analysisVersionId}
        />
      }
    >
      <ScrollArea className="h-[calc(100svh-(42px+14px+21px))] pr-2">
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="flex flex-row items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Analysis Version {analysisVersion.name}
                </h1>
              </div>
              <div className="flex gap-6">
                {analysisVersion.is_active && (
                  <Badge variant="green" className="w-fit">
                    Active Version
                  </Badge>
                )}
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  <span>Created {formatDate(analysisVersion.created_at)}</span>
                </div>
                <Relations analysisVersion={analysisVersion} teamId={resolvedParams.teamId} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  {getTriggerIcon(analysisVersion.trigger)}
                  <span className="text-sm font-medium text-foreground">Trigger</span>
                </div>
                <p className="text-sm text-muted-foreground capitalize">
                  {analysisVersion.trigger.replace("_", " ")}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="size-4 text-purple-400" />
                  <span className="text-sm font-medium text-foreground">Functions in Scope</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {analysisVersion.version.n_scopes}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="size-4 text-orange-400" />
                  <span className="text-sm font-medium text-foreground">Findings</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {analysisVersion.version.n_findings}
                </p>
              </div>
            </div>
          </div>
          <AnalysisVersionClient
            teamId={resolvedParams.teamId}
            analysisVersionId={resolvedParams.analysisVersionId}
          />
        </div>
      </ScrollArea>
    </Container>
  );
};

export default SourcesPage;
