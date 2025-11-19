"use client";

import { analysisActions, projectActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { ProjectSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Unlock } from "lucide-react";
import React, { useState } from "react";

const CreateAnalysisModal: React.FC<{
  teamSlug: string;
  project?: ProjectSchemaI;
  onSuccess?: (analysisId: string) => void;
}> = ({ teamSlug, project, onSuccess }) => {
  const queryClient = useQueryClient();
  const [projectIdUse, setProjectIdUse] = useState<string | undefined>(project?.id);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const projectQuery = {
    page_size: "6",
    name: "",
    tag: "",
  };

  // Fetch this only if the project is not provided. We'll hardcord the provided project otherwise.
  const { data: projects } = useQuery({
    queryKey: generateQueryKey.projects(teamSlug, projectQuery),
    queryFn: async () => projectActions.getProjects(teamSlug, projectQuery),
    enabled: !project,
  });

  const createAnalysisMutation = useMutation({
    mutationFn: async (data: {
      project_id: string;
      name?: string;
      description?: string;
      is_public?: boolean;
    }) => analysisActions.createAnalysis(teamSlug, data),
    onSuccess: ({ id, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      onSuccess?.(id);
    },
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!projectIdUse) return;

    const projectData = {
      project_id: projectIdUse,
      ...(name && { name }),
      ...(description && { description }),
      ...(isPublic && {
        is_public: isPublic,
      }),
    };

    createAnalysisMutation.mutate(projectData);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New Analysis</DialogTitle>
        <DialogDescription>
          Create a security analysis for your smart contract project
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="justify-center flex flex-col gap-2">
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Project</Label>
            <Select
              value={projectIdUse}
              onValueChange={setProjectIdUse}
              disabled={!!project || createAnalysisMutation.isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {project && (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                )}
                {!project &&
                  projects?.results?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createAnalysisMutation.isPending}
              placeholder="Enter analysis name (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createAnalysisMutation.isPending}
              placeholder="Describe your analysis (optional)"
            />
          </div>

          <div className="space-y-2">
            <div className="space-y-1">
              <Label>Visibility</Label>
              <span className="text-sm text-neutral-500">
                Make this analysis shareable with others, even outside of your team
              </span>
            </div>
            <Toggle
              aria-label="Toggle visibility"
              size="sm"
              variant="outline"
              color="purple"
              onClick={() => setIsPublic(!isPublic)}
              disabled={createAnalysisMutation.isPending}
              className={cn(isPublic && "bg-purple text-purple-foreground")}
            >
              {isPublic && (
                <>
                  <Unlock /> Public
                </>
              )}
              {!isPublic && (
                <>
                  <Lock />
                  Private
                </>
              )}
            </Toggle>
          </div>

          {createAnalysisMutation.error && (
            <p className="text-sm text-red-400">{createAnalysisMutation.error.message}</p>
          )}
          {createAnalysisMutation.isSuccess && (
            <p className="text-sm text-green-400">Analysis successfully created</p>
          )}
        </div>
        <DialogFooter>
          <DialogClose disabled={createAnalysisMutation.isPending} asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={
              createAnalysisMutation.isPending || !projectIdUse || createAnalysisMutation.isSuccess
            }
          >
            {createAnalysisMutation.isPending ? "Creating..." : "Create Analysis"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

export default CreateAnalysisModal;
