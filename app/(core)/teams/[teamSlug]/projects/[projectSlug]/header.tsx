import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/helpers";
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
    <div className="px-6 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-100 mb-2">{project.name}</h1>
            <div className="flex items-center space-x-4 text-sm text-neutral-400">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Created {formatDate(project.created_at)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <GitBranch className="w-4 h-4" />
                <span>{project.n_versions} versions</span>
              </div>
              <div className="flex items-center space-x-1">
                <File className="w-4 h-4" />
                <span>{project.n_audits} audits</span>
              </div>
              <div className="flex items-center space-x-1">
                {project.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="px-2 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700 flex items-center space-x-1"
                  >
                    <Tag className="w-2 h-2" />
                    <span>{tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link href={`/teams/${teamSlug}/projects/${projectSlug}/versions/new`}>
            <Button variant="bright" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>New Version</span>
            </Button>
          </Link>
        </div>
      </div>
      {includeDescription && project.description && (
        <div className="my-2">
          <p className="text-lg text-neutral-300 leading-relaxed">{project.description}</p>
        </div>
      )}
    </div>
  );
};
