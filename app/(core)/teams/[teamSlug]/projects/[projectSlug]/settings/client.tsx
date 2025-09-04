"use client";

import { bevorAction } from "@/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CodeProjectSchema } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, File, GitBranch, Save, Tag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface ProjectSettingsPageClientProps {
  teamSlug: string;
  project: CodeProjectSchema;
  isUpdated?: boolean;
}

const ProjectSettingsPageClient: React.FC<ProjectSettingsPageClientProps> = ({
  teamSlug,
  project,
  isUpdated,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(project.description || "");
  const [projectTags, setProjectTags] = useState(project.tags.join(", "));
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(isUpdated);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateProjectMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string; tags?: string }) =>
      bevorAction.updateProject(project.id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      if (data.slug !== project.slug) {
        router.push(`/teams/${teamSlug}/projects/${data.slug}/settings?updated=true`);
      } else {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1500);
      }
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async () => bevorAction.deleteProject(project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push(`/teams/${teamSlug}/projects`);
    },
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleSave = (e: React.FormEvent): void => {
    e.preventDefault();
    const trimmedTags = projectTags.trim();

    const hasChanges =
      project.name !== projectName ||
      project.description !== projectDescription ||
      project.tags.join(", ") !== trimmedTags;

    if (!hasChanges) return;

    updateProjectMutation.mutate({
      name: projectName,
      description: projectDescription,
      tags: trimmedTags,
    });
  };

  useEffect(() => {
    if (!updateProjectMutation.isError) return;
    setShowError(true);
    const timeout = setTimeout(() => {
      setShowError(false);
    }, 1500);
    return (): void => clearTimeout(timeout);
  }, [updateProjectMutation.isError]);

  useEffect(() => {
    if (!isUpdated) return;
    const timeout = setTimeout(() => {
      setShowSuccess(false);
    }, 1500);
    return (): void => clearTimeout(timeout);
  }, [isUpdated]);

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-semibold text-neutral-100">Project Information</h3>
        </div>
        <div className="flex flex-row gap-8 items-center">
          <p className="block text-sm font-medium text-neutral-300 w-16">Created</p>
          <div className="flex items-center space-x-2 text-sm text-neutral-400">
            <Calendar className="size-4" />
            <span>{formatDate(project.created_at)}</span>
          </div>
        </div>
        <div className="flex flex-row gap-8 items-center">
          <p className="block text-sm font-medium text-neutral-300 w-16">Versions</p>
          <div className="flex items-center space-x-2 text-sm text-neutral-400">
            <GitBranch className="size-4" />
            <span>{project.n_versions}</span>
          </div>
        </div>
        <div className="flex flex-row gap-8 items-center">
          <p className="block text-sm font-medium text-neutral-300 w-16">Audits</p>
          <div className="flex items-center space-x-2 text-sm text-neutral-400">
            <File className="size-4" />
            <span>{project.n_audits}</span>
          </div>
        </div>
        {project.tags.length > 0 && (
          <div className="flex flex-row gap-8 items-center">
            <p className="block text-sm font-medium text-neutral-300 w-16">Tags</p>
            <div className="flex items-center space-x-2 text-sm text-neutral-400">
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
        )}
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSave}>
        <div className="space-y-4">
          <div className="flex flex-row flex-wrap items-end gap-x-4 gap-y-2">
            <div className="grow min-w-52 max-w-80">
              <label className="block font-medium text-neutral-300 mb-2" htmlFor="project-name">
                Project Name
              </label>
              <Input
                type="text"
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={updateProjectMutation.isPending}
                placeholder="Enter project name"
              />
            </div>
            <div className="grow min-w-52 max-w-80">
              <label className="block font-medium text-neutral-300 mb-2" htmlFor="project-tags">
                Tags
              </label>
              <Input
                type="text"
                id="project-tags"
                value={projectTags}
                onChange={(e) => setProjectTags(e.target.value)}
                disabled={updateProjectMutation.isPending}
                placeholder="Enter tags separated by commas"
              />
            </div>
          </div>
          <div className="max-w-[calc(2*20rem+1rem)]">
            <label
              className="block font-medium text-neutral-300 mb-2"
              htmlFor="project-description"
            >
              Description
            </label>
            <Textarea
              id="project-description"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              disabled={updateProjectMutation.isPending}
              placeholder="Enter project description"
              rows={3}
            />
          </div>
          <Button
            type="submit"
            disabled={
              updateProjectMutation.isPending ||
              (project.name === projectName &&
                project.description === projectDescription &&
                project.tags.join(", ") === projectTags.trim())
            }
          >
            <Save className="size-4" />
            {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
        <div className="min-h-5">
          {showError && (
            <p className="text-xs text-red-400">Failed to update project. Please try again.</p>
          )}
          {showSuccess && <p className="text-xs text-green-400">Project updated successfully!</p>}
        </div>
      </form>

      <Alert variant="destructive" className="w-fit">
        <Trash2 className="size-4" />
        <AlertTitle>Delete Project</AlertTitle>
        <AlertDescription>
          This will permanently delete the project and all associated versions, audits, and data.
          <div className="space-y-4 text-primary mt-2">
            {!showDeleteConfirm ? (
              <Button variant="outline" onClick={() => setShowDeleteConfirm(true)}>
                Delete
              </Button>
            ) : (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-neutral-300 font-medium">Are you sure?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteProjectMutation.mutate()}
                  disabled={deleteProjectMutation.isPending}
                >
                  {deleteProjectMutation.isPending ? "Deleting..." : "Yes, Delete"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            )}
            {deleteProjectMutation.isError && (
              <p className="text-xs text-red-400 mt-2">
                Failed to delete project. Please try again.
              </p>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ProjectSettingsPageClient;
