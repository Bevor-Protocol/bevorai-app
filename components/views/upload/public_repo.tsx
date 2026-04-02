"use client";

import { codeActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useFormReducer } from "@/hooks/useFormReducer";
import type { ProjectDetailedSchema } from "@/types/api/responses/business";
import {
  CreateCodeFromPublicGithubFormValues,
  createCodeFromPublicGithubSchema,
} from "@/utils/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, GitCommitHorizontal, Loader2, XCircle } from "lucide-react";
import React, { useCallback, useRef } from "react";
import { toast } from "sonner";

type RepoUploadVariables = {
  project: ProjectDetailedSchema;
  data: CreateCodeFromPublicGithubFormValues;
};

const startPublicRepoUpload = async (
  ensureProject: (tags: string[]) => Promise<ProjectDetailedSchema>,
  tags: string[],
  data: CreateCodeFromPublicGithubFormValues,
  mutate: (vars: RepoUploadVariables) => void,
): Promise<void> => {
  const project = await ensureProject(tags);
  mutate({ project, data });
};

const RepoUrlStep: React.FC<{
  ensureProject: (tags: string[]) => Promise<ProjectDetailedSchema>;
  parentId?: string;
  onSuccess?: (id: string) => void;
}> = ({ ensureProject, parentId, onSuccess }) => {
  const queryClient = useQueryClient();

  const initialState: CreateCodeFromPublicGithubFormValues = {
    url: "",
    parent_code_version_id: parentId,
  };
  const { formState, setField, updateFormState } =
    useFormReducer<CreateCodeFromPublicGithubFormValues>(initialState);

  const toastId = useRef<string | number>(undefined);

  const mutation = useMutation({
    mutationFn: async ({ project, data }: RepoUploadVariables) =>
      codeActions.contractUploadPublicRepo(project.team.slug, project.id, data).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onMutate: () => {
      updateFormState({ type: "SET_ERRORS", errors: {} });
      toastId.current = toast.loading("Uploading code...");
    },
    onError: () => {
      toast.dismiss(toastId.current);
      updateFormState({
        type: "SET_ERRORS",
        errors: { url: "Something went wrong" },
      });
    },
    onSuccess: ({ analysis_id, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Successfully uploaded code", {
        id: toastId.current,
      });
      if (analysis_id) onSuccess?.(analysis_id);
    },
  });

  const submitRepo = useCallback(() => {
    updateFormState({ type: "SET_ERRORS", errors: {} });

    const parsed = createCodeFromPublicGithubSchema.safeParse(formState.values);

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

    void startPublicRepoUpload(ensureProject, ["public-repo"], parsed.data, mutation.mutate).catch(
      () => {},
    );
  }, [ensureProject, formState.values, mutation, updateFormState]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    submitRepo();
  };

  const repoData = mutation.data;
  const showOpeningAnalysis =
    mutation.isSuccess &&
    !!repoData?.analysis_id &&
    (repoData.status === "waiting" ||
      repoData.status === "processing" ||
      repoData.status === "success");

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <GitCommitHorizontal className="size-5 shrink-0 text-foreground" aria-hidden />
          <DialogTitle>Public GitHub repository</DialogTitle>
        </div>
        <DialogDescription>Enter a public GitHub Solidity repository URL.</DialogDescription>
      </DialogHeader>
      {showOpeningAnalysis ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Opening analysis…</p>
        </div>
      ) : mutation.isError ? (
        <div className="mx-auto max-w-2xl space-y-8">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <XCircle className="size-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold">Upload Failed</h2>
            <p className="text-muted-foreground">
              There was an error processing your contract. Please try again.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Button variant="outline" onClick={() => mutation.reset()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="url" aria-required>
                Github Repository
              </FieldLabel>
              <div className="flex flex-row flex-wrap gap-4">
                <Input
                  id="url"
                  name="url"
                  type="text"
                  value={formState.values.url}
                  onChange={(e) => setField("url", e.target.value)}
                  placeholder="https://github.com/..."
                  className="max-w-full grow basis-1/2 font-mono"
                  disabled={mutation.isPending}
                  aria-invalid={!!formState.errors.url}
                />
                <Button
                  type="submit"
                  disabled={mutation.isPending || !formState.values.url.trim()}
                  className="min-w-40 grow"
                >
                  <span>Submit</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>
              {formState.errors.url && (
                <p className="text-sm text-destructive">{formState.errors.url}</p>
              )}
            </Field>
          </FieldGroup>
        </form>
      )}
    </>
  );
};

export default RepoUrlStep;
