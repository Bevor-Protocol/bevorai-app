import { bevorAction } from "@/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/helpers";
import { navigation } from "@/utils/navigation";
import { AsyncComponent } from "@/utils/types";
import { Calendar, File, GitBranch, Plus, Tag } from "lucide-react";
import Link from "next/link";

export const ProjectHeader: AsyncComponent<{
  teamSlug: string;
  projectSlug: string;
  includeDescription?: boolean;
}> = async ({ teamSlug, projectSlug, includeDescription = false }) => {
  const project = await bevorAction.getProjectBySlug(projectSlug);

  return (
    <div className="flex flex-row justify-between mb-8 border-b border-b-neutral-800 py-4">
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
        {includeDescription && project.description && (
          <div className="my-2">
            <p className="text-lg text-foreground leading-relaxed">{project.description}</p>
          </div>
        )}
      </div>
      <div className="flex space-x-3">
        <Link href={navigation.project.versions.new.overview({ teamSlug, projectSlug })}>
          <Button className="flex items-center">
            <Plus className="size-4" />
            <span>New Version</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
