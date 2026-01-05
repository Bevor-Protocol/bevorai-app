"use client";

import { projectActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFormReducer } from "@/hooks/useFormReducer";
import { ProjectFormValues, projectFormSchema } from "@/utils/schema";
import { isApiError } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";

const CreateProjectModal: React.FC<{
  teamSlug: string;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ teamSlug, setOpen }) => {
  const queryClient = useQueryClient();

  const initialState: ProjectFormValues = {
    name: "",
    description: "",
    tags: "",
  };
  const { formState, setField, updateFormState } = useFormReducer<ProjectFormValues>(initialState);

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) =>
      projectActions.createProject(teamSlug, data).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    updateFormState({ type: "SET_ERRORS", errors: {} });

    const parsed = projectFormSchema.safeParse(formState.values);

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

    createProjectMutation.mutate(parsed.data);
  };

  console.log(createProjectMutation.error);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogDescription>
          Create a project to organize your smart contracts and analyses. All members of the team
          will have access to this project
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name" aria-required>
              Project Name
            </FieldLabel>
            <Input
              id="name"
              type="text"
              name="name"
              value={formState.values.name}
              onChange={(e) => setField("name", e.target.value)}
              disabled={createProjectMutation.isPending}
              placeholder="My first project"
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
              className="w-full min-h-[80px]"
              value={formState.values.description || ""}
              onChange={(e) => setField("description", e.target.value)}
              disabled={createProjectMutation.isPending}
              placeholder="Project description..."
              aria-invalid={!!formState.errors.description}
            />
            {formState.errors.description && (
              <p className="text-sm text-destructive">{formState.errors.description}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="tags">Tags</FieldLabel>
            <Input
              id="tags"
              name="tags"
              type="text"
              value={formState.values.tags || ""}
              onChange={(e) => setField("tags", e.target.value)}
              disabled={createProjectMutation.isPending}
              placeholder="codebase-1, exploratory"
              aria-invalid={!!formState.errors.tags}
            />
            {formState.errors.tags && (
              <p className="text-sm text-destructive">{formState.errors.tags}</p>
            )}
          </Field>
        </FieldGroup>

        {createProjectMutation.error && isApiError(createProjectMutation.error) && (
          <p className="text-sm text-destructive">{createProjectMutation.error.error.message}</p>
        )}
        <DialogFooter className="mt-2">
          <DialogClose disabled={createProjectMutation.isPending} asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={createProjectMutation.isPending || createProjectMutation.isSuccess}
          >
            {createProjectMutation.isPending ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

export default CreateProjectModal;
