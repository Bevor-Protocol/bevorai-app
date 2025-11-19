"use client";

import { projectActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreateProjectFormValues, createProjectSchema } from "@/utils/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Code } from "lucide-react";
import React, { useState } from "react";

const CreateProjectModal: React.FC<{
  teamSlug: string;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ teamSlug, setOpen }) => {
  const queryClient = useQueryClient();
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectFormValues) =>
      projectActions.createProject(teamSlug, data),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setOpen(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    const parsed = createProjectSchema.safeParse({
      name: projectName,
      description: description || undefined,
      tags: tags || undefined,
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Please review the form and try again.";
      setError(message);
      return;
    }

    createProjectMutation.mutate(parsed.data);
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

          {error && <p className="text-sm text-red-400">{error}</p>}
          {createProjectMutation.error && (
            <p className="text-sm text-red-400">{createProjectMutation.error.message}</p>
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
