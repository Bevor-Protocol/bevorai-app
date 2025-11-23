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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { useFormReducer } from "@/hooks/useFormReducer";
import { cn } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { DefaultProjectsQuery } from "@/utils/query-params";
import { CreateAnalysisThreadFormValues, createAnalysisThreadSchema } from "@/utils/schema";
import { ProjectSchemaI } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Unlock } from "lucide-react";
import React from "react";

const CreateAnalysisModal: React.FC<{
  teamSlug: string;
  project?: ProjectSchemaI;
  onSuccess?: (analysisId: string) => void;
}> = ({ teamSlug, project, onSuccess }) => {
  const queryClient = useQueryClient();
  const initialState: CreateAnalysisThreadFormValues = {
    project_id: project?.id || "",
    is_public: false,
  };
  const { formState, setField, updateFormState } =
    useFormReducer<CreateAnalysisThreadFormValues>(initialState);

  // Fetch this only if the project is not provided. We'll hardcord the provided project otherwise.
  const { data: projects } = useQuery({
    queryKey: generateQueryKey.projects(teamSlug, DefaultProjectsQuery),
    queryFn: async () => projectActions.getProjects(teamSlug, DefaultProjectsQuery),
    enabled: !project,
  });

  const createAnalysisMutation = useMutation({
    mutationFn: async (data: CreateAnalysisThreadFormValues) =>
      analysisActions.createAnalysis(teamSlug, data),
    onSuccess: ({ id, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      onSuccess?.(id);
    },
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    updateFormState({ type: "SET_ERRORS", errors: {} });

    const parsed = createAnalysisThreadSchema.safeParse(formState.values);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path) {
          fieldErrors[path] = issue.message;
        }
      });
      updateFormState({ type: "SET_ERRORS", errors: fieldErrors });
      return;
    }

    createAnalysisMutation.mutate(parsed.data);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New Analysis Thread</DialogTitle>
        <DialogDescription>
          Create a security analysis thread for your smart contract project. This will act as your
          personal workspace and contain analysis versions.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="project_id" aria-required>
              Project
            </FieldLabel>
            <Select
              value={formState.values.project_id}
              onValueChange={(value) => setField("project_id", value)}
              disabled={!!project || createAnalysisMutation.isPending}
            >
              <SelectTrigger
                id="project_id"
                className="w-full"
                aria-invalid={!!formState.errors.project_id}
              >
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {project && (
                  <SelectItem key={project.id} value={project.id}>
                    <Icon size="sm" seed={project.id} />
                    {project.name}
                  </SelectItem>
                )}
                {!project &&
                  projects?.results?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <Icon size="sm" seed={project.id} />
                      {project.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {formState.errors.project_id && (
              <p className="text-sm text-destructive">{formState.errors.project_id}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              name="name"
              type="text"
              value={formState.values.name || ""}
              onChange={(e) => setField("name", e.target.value)}
              disabled={createAnalysisMutation.isPending}
              placeholder="Enter analysis name (optional)"
              aria-invalid={!!formState.errors.name}
            />
            {formState.errors.name && (
              <p className="text-sm text-destructive">{formState.errors.name}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              name="description"
              value={formState.values.description || ""}
              onChange={(e) => setField("description", e.target.value)}
              disabled={createAnalysisMutation.isPending}
              placeholder="Describe your analysis (optional)"
              aria-invalid={!!formState.errors.description}
            />
            {formState.errors.description && (
              <p className="text-sm text-destructive">{formState.errors.description}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="visibility">Visibility</FieldLabel>
            <span className="text-sm text-neutral-500">
              Make this analysis shareable with others, even outside of your team
            </span>
            <Toggle
              id="visibility"
              aria-label="Toggle visibility"
              size="sm"
              variant="outline"
              color="purple"
              onClick={() => setField("is_public", !formState.values.is_public)}
              disabled={createAnalysisMutation.isPending}
              className={cn(formState.values.is_public && "bg-purple text-purple-foreground")}
            >
              {formState.values.is_public && (
                <>
                  <Unlock /> Public
                </>
              )}
              {!formState.values.is_public && (
                <>
                  <Lock />
                  Private
                </>
              )}
            </Toggle>
          </Field>
        </FieldGroup>

        {createAnalysisMutation.error && (
          <p className="text-sm text-destructive">{createAnalysisMutation.error.message}</p>
        )}
        {createAnalysisMutation.isSuccess && (
          <p className="text-sm text-green-400">Analysis successfully created</p>
        )}
        <DialogFooter className="mt-2">
          <DialogClose disabled={createAnalysisMutation.isPending} asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={createAnalysisMutation.isPending}>
            {createAnalysisMutation.isPending ? "Creating..." : "Create Analysis"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

export default CreateAnalysisModal;
