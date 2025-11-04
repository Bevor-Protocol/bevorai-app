import { activityActions, breadcrumbActions, projectActions } from "@/actions/bevor";
import ActivityList from "@/components/activity";
import ContainerBreadcrumb from "@/components/breadcrumbs";
import Container from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { getQueryClient } from "@/lib/config/query";
import { formatDate } from "@/utils/helpers";
import { AsyncComponent } from "@/utils/types";
import { Calendar, File, GitBranch, Tag } from "lucide-react";

interface ProjectPageProps {
  params: Promise<{ teamId: string; projectId: string }>;
}

const ProjectPage: AsyncComponent<ProjectPageProps> = async ({ params }) => {
  const queryClient = getQueryClient();
  const { teamId, projectId } = await params;

  const [project, activities, breadcrumb] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: ["projects", teamId, projectId],
      queryFn: async () => projectActions.getProject(teamId, projectId),
    }),
    queryClient.fetchQuery({
      queryKey: ["activities", teamId, projectId],
      queryFn: async () => activityActions.getProjectActivities(teamId, projectId),
    }),
    queryClient.fetchQuery({
      queryKey: ["breadcrumb", teamId],
      queryFn: () => breadcrumbActions.getProjectBreadcrumb(teamId, projectId),
    }),
  ]);

  return (
    <Container breadcrumb={<ContainerBreadcrumb breadcrumb={breadcrumb} />}>
      <div className="max-w-5xl m-auto mt-8 lg:mt-16">
        <div className="flex flex-col gap-6">
          <h1>{project.name}</h1>
          <div className="flex flex-row gap-2 items-center">
            <div className="text-muted-foreground">Owner:</div>
            <Icon size="sm" seed={project.created_by_user.id} />
            <div>{project.created_by_user.username}</div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-1">
              <Calendar className="size-4" />
              <span>{formatDate(project.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitBranch className="size-4" />
              <span>{project.n_versions} versions</span>
            </div>
            <div className="flex items-center gap-1">
              <File className="size-4" />
              <span>{project.n_analyses} analyses</span>
            </div>
          </div>
          {project.description && (
            <div className="my-2">
              <p className="text-lg leading-relaxed">{project.description}</p>
            </div>
          )}
          <div className="flex items-center gap-1">
            {project.tags.map((tag, index) => (
              <Badge key={index} variant="outline">
                <Tag className="w-2 h-2" />
                <span>{tag}</span>
              </Badge>
            ))}
          </div>
          <ActivityList activities={activities} className="mt-8" />
        </div>
      </div>
    </Container>
  );
};

export default ProjectPage;
