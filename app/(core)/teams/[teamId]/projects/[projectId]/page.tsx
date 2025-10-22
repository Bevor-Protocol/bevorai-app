import { projectActions, securityAnalysisActions, versionActions } from "@/actions/bevor";
import { AuditElement } from "@/components/audits/element";
import { AuditEmpty } from "@/components/audits/empty";
import Container from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeVersionElement } from "@/components/versions/element";
import { VersionEmpty } from "@/components/versions/empty";
import { formatDate } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { AsyncComponent } from "@/utils/types";
import { Calendar, File, GitBranch, Plus, Tag } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

const VersionsList: AsyncComponent<{
  teamId: string;
  projectId: string;
}> = async ({ teamId, projectId }) => {
  const versions = await versionActions.getVersions({ project_id: projectId, page_size: "6" });

  if (versions.results.length > 0) {
    return (
      <div className="flex flex-col gap-3">
        {versions.results.slice(0, 3).map((version) => (
          <CodeVersionElement key={version.id} version={version} teamId={teamId} isPreview />
        ))}
      </div>
    );
  }

  return <VersionEmpty />;
};

const AuditsList: AsyncComponent<{
  teamId: string;
  projectId: string;
}> = async ({ teamId, projectId }) => {
  await new Promise((resolve) => setTimeout(() => resolve(true), 3000));
  const audits = await securityAnalysisActions.getSecurityAnalyses({
    project_id: projectId,
    page_size: "6",
  });

  if (audits.results.length > 0) {
    return (
      <div className="flex flex-col gap-3">
        {audits.results.slice(0, 3).map((audit) => (
          <AuditElement key={audit.id} audit={audit} teamId={teamId} />
        ))}
      </div>
    );
  }

  return <AuditEmpty />;
};

const ProjectHeader: AsyncComponent<{
  teamId: string;
  projectId: string;
}> = async ({ teamId, projectId }) => {
  const project = await projectActions.getProject(projectId);

  return (
    <div className="flex flex-row justify-between mb-8 border-b border-b-border py-4">
      <div className="space-x-4">
        <div>
          <h1>{project.name}</h1>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
            <div className="flex items-center space-x-1">
              <Calendar className="size-4" />
              <span>Created {formatDate(project.created_at)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <GitBranch className="size-4" />
              <span>{project.n_versions} versions</span>
            </div>
            <div className="flex items-center space-x-1">
              <File className="size-4" />
              <span>{project.n_audits} audits</span>
            </div>
            <div className="flex items-center space-x-1">
              {project.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  <Tag className="w-2 h-2" />
                  <span>{tag}</span>
                </Badge>
              ))}
            </div>
          </div>
        </div>
        {project.description && (
          <div className="my-2">
            <p className="text-lg leading-relaxed">{project.description}</p>
          </div>
        )}
      </div>
      <div className="flex space-x-3">
        <Button asChild>
          <Link href={navigation.project.versions.new.overview({ teamId, projectId })}>
            <Plus className="size-4" />
            <span>New Version</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};

interface ProjectPageProps {
  params: Promise<{ teamId: string; projectId: string }>;
}

const ProjectPage: AsyncComponent<ProjectPageProps> = async ({ params }) => {
  const { teamId, projectId } = await params;

  return (
    <Container>
      <ProjectHeader teamId={teamId} projectId={projectId} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="mb-4 flex items-center gap-4">
            <h2>Recent Code Versions</h2>
            <Link
              href={navigation.project.versions.overview({ teamId, projectId })}
              className="text-sm text-link hover:text-link-accent transition-colors"
            >
              View all →
            </Link>
          </div>
          <Suspense>
            <VersionsList teamId={teamId} projectId={projectId} />
          </Suspense>
        </div>
        <div>
          <div className="mb-4 flex items-center gap-4">
            <h2>Recent Audits</h2>
            <Link
              href={navigation.project.audits({ teamId, projectId })}
              className="text-sm text-link hover:text-link-accent transition-colors"
            >
              View all →
            </Link>
          </div>
          <Suspense>
            <AuditsList teamId={teamId} projectId={projectId} />
          </Suspense>
        </div>
      </div>
    </Container>
  );
};

export default ProjectPage;
