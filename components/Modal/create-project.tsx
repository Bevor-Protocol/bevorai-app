"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { navigation } from "@/utils/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Code } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const CreateProjectModal: React.FC<{ targetTeamSlug: string }> = ({ targetTeamSlug }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { teamSlug } = useParams<{ teamSlug: string }>();
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  const { mutate, error, isSuccess, data, isPending } = useMutation({
    mutationFn: async (data: { name: string; description?: string; tags?: string[] }) =>
      bevorAction.createProject(data),
  });

  useEffect(() => {
    if (!isSuccess || !data) return;
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    const timeout = setTimeout(() => {
      // Redirect to the new project
      router.push(
        navigation.project.overview({ teamSlug: targetTeamSlug, projectSlug: data.slug }),
      );
      if (teamSlug !== targetTeamSlug) {
        router.push(`/teams/${targetTeamSlug}`);
      }
    }, 1000);

    return (): void => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, data, router]);

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

    await mutate(projectData);
  };

  return (
    <div>
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
              disabled={isPending}
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
              disabled={isPending}
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
              disabled={isPending}
              placeholder="Enter tags separated by commas (optional)"
            />
            <p className="text-xs text-neutral-500">Example: defi, ethereum, security</p>
          </div>

          {error && <p className="text-sm text-red-400">{error.message}</p>}
          {isSuccess && <p className="text-sm text-green-400">Project successfully created</p>}
        </div>
        <div className="flex justify-between pt-4 border-t border-neutral-800">
          <DialogClose disabled={isPending} asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isPending || !projectName.trim() || isSuccess}>
            {isPending ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateProjectModal;
