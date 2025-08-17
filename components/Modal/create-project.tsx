"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Code, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface CreateProjectModalProps {
  onClose: () => void;
  targetTeamSlug: string;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, targetTeamSlug }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { teamSlug } = useParams<{ teamSlug: string }>();
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  const {
    mutate,
    error,
    isSuccess,
    data: projectId,
    isPending,
  } = useMutation({
    mutationFn: async (data: { name: string; description?: string; tags?: string[] }) =>
      bevorAction.createProject(data),
  });

  useEffect(() => {
    if (!isSuccess || !projectId) return;
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    const timeout = setTimeout(() => {
      // Redirect to the new project
      if (teamSlug !== targetTeamSlug) {
        router.push(`/teams/${targetTeamSlug}`);
      }
      onClose();
    }, 1000);

    return (): void => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, projectId, router, onClose]);

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
    <form onSubmit={handleSubmit} className="justify-center flex flex-col gap-2">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800 w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Code className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-100">Create New Project</h2>
            <p className="text-sm text-neutral-400">
              Create a project to organize your smart contract audits
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="p-2 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
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
        <Button type="button" variant="dark" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="bright"
          disabled={isPending || !projectName.trim() || isSuccess}
        >
          {isPending ? "Creating..." : "Create Project"}
        </Button>
      </div>
    </form>
  );
};

export default CreateProjectModal;
