import { projectActions } from "@/actions/bevor";
import Container from "@/components/container";
import ProjectSubnav from "@/components/subnav/project";
import { Button } from "@/components/ui/button";
import { getQueryClient } from "@/lib/config/query";
import { generateQueryKey } from "@/utils/constants";
import { AsyncComponent } from "@/utils/types";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PlayCircle } from "lucide-react";
import Link from "next/link";
import ProjectClient, {
    AnalysesPreview,
    CodePreview,
    ProjectActivities,
    UploadCodeButton,
} from "./project-client";

interface ProjectPageProps {
  params: Promise<{ teamSlug: string; projectSlug: string }>;
}

const ProjectPage: AsyncComponent<ProjectPageProps> = async ({ params }) => {
  const queryClient = getQueryClient();
  const { teamSlug, projectSlug } = await params;

  queryClient.fetchQuery({
    queryKey: generateQueryKey.project(projectSlug),
    queryFn: async () =>
      projectActions.getProject(teamSlug, projectSlug).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Container subnav={<ProjectSubnav />}>
        <div className="max-w-7xl mx-auto py-8">
          <ProjectClient teamSlug={teamSlug} projectSlug={projectSlug} />
          <div className="py-6 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
            <div className="min-w-0 space-y-10">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Analyses</h3>
                  <Button asChild size="sm">
                    <Link href={`/team/${teamSlug}/${projectSlug}/analyses`}>
                      <PlayCircle className="size-4" />
                      Run Analysis
                    </Link>
                  </Button>
                </div>
                <AnalysesPreview teamSlug={teamSlug} projectSlug={projectSlug} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Code Versions</h3>
                  <UploadCodeButton teamSlug={teamSlug} projectSlug={projectSlug} variant="ghost" />
                </div>
                <CodePreview teamSlug={teamSlug} projectSlug={projectSlug} />
              </div>
            </div>
            <div className="min-w-0">
              <ProjectActivities teamSlug={teamSlug} projectSlug={projectSlug} />
            </div>
          </div>
        </div>
      </Container>
    </HydrationBoundary>
  );
};

export default ProjectPage;
