"use client";

import { projectActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Code } from "lucide-react";
import React, { useState } from "react";

const CreateProjectModal: React.FC<{ teamId: string }> = ({ teamId }) => {
  const queryClient = useQueryClient();
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; tags?: string[] }) =>
      projectActions.createProject(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    const projectData = {
      name: projectName,
      ...(description && { description }),
      ...(tags && {
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    };

    await createProjectMutation.mutate(projectData);
  };

  return (
    <>
      <DialogHeader>
        <div className="inline-flex gap-2 items-center">
          <Code className="size-5 text-blue-400" />
          <DialogTitle>Create New Project</DialogTitle>
        </div>
        <DialogDescription>
          Create a project to organize your smart contract versions and audits
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="justify-center flex flex-col gap-2">
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-md font-medium text-neutral-200">
              Project Name <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              className="bg-gray-900 rounded px-3 py-2 text-sm flex-1 w-full"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={createProjectMutation.isPending}
              required
              placeholder="Enter project name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-md font-medium text-neutral-200">Description</label>
            <Textarea
              className="bg-gray-900 rounded px-3 py-2 text-sm flex-1 w-full min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createProjectMutation.isPending}
              placeholder="Describe your project (optional)"
            />
          </div>

          <div className="space-y-2">
            <label className="text-md font-medium text-neutral-200">Tags</label>
            <Input
              type="text"
              className="bg-gray-900 rounded px-3 py-2 text-sm flex-1 w-full"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={createProjectMutation.isPending}
              placeholder="Enter tags separated by commas (optional)"
            />
            <p className="text-xs text-neutral-500">Example: defi, ethereum, security</p>
          </div>

          {createProjectMutation.error && (
            <p className="text-sm text-red-400">{createProjectMutation.error.message}</p>
          )}
          {createProjectMutation.isSuccess && (
            <p className="text-sm text-green-400">Project successfully created</p>
          )}
        </div>
        <div className="flex justify-between pt-4 border-t border-border">
          <DialogClose disabled={createProjectMutation.isPending} asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={
              createProjectMutation.isPending ||
              !projectName.trim() ||
              createProjectMutation.isSuccess
            }
          >
            {createProjectMutation.isPending ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </>
  );
};

export default CreateProjectModal;
