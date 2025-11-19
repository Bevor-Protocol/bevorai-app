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
  teamSlug: string;
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
    resolvedParams.teamSlug,
    resolvedParams.analysisVersionId,
  );

  return (
    <Container
      breadcrumb={
        <ContainerBreadcrumb
          queryKey={[resolvedParams.analysisVersionId]}
          queryType="analysis-version"
          teamSlug={resolvedParams.teamSlug}
          id={resolvedParams.analysisVersionId}
        />
      }
    >
      <ScrollArea className="h-[calc(100svh-(42px+14px+21px))] pr-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">
              Analysis Version {analysisVersion.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {analysisVersion.is_active && (
                <Badge variant="green" size="sm">
                  Active
                </Badge>
              )}
              <div className="flex items-center gap-1">
                {getTriggerIcon(analysisVersion.trigger)}
                <span className="capitalize">{analysisVersion.trigger.replace("_", " ")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="size-3 text-purple-400" />
                <span>{analysisVersion.version.n_scopes} scopes</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="size-3 text-orange-400" />
                <span>{analysisVersion.version.n_findings} findings</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="size-3" />
                <span>{formatDate(analysisVersion.created_at)}</span>
              </div>
              <Relations analysisVersion={analysisVersion} teamSlug={resolvedParams.teamSlug} />
            </div>
          </div>

          <AnalysisVersionClient
            teamSlug={resolvedParams.teamSlug}
            analysisVersion={analysisVersion}
          />
        </div>
      </ScrollArea>
    </Container>
  );
};

export default SourcesPage;
