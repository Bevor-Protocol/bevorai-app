"use client";

import { codeActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useFormReducer } from "@/hooks/useFormReducer";
import { useSSE } from "@/providers/sse";
import { ProjectDetailedSchema } from "@/types/api/responses/business";
import {
  CreateCodeFromPublicGithubFormValues,
  createCodeFromPublicGithubSchema,
} from "@/utils/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle, GitCommitHorizontal, XCircle } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const RepoUrlStep: React.FC<{
  project: ProjectDetailedSchema;
  parentId?: string;
  onSuccess?: (id: string) => void;
}> = ({ project, parentId }) => {
  const queryClient = useQueryClient();
  const { registerCallback } = useSSE();
  const sseToastId = useRef<string | number | undefined>(undefined);
  const unregisterRef = useRef<() => void | undefined>(undefined);
  const [processingStatus, setProcessingStatus] = useState<
    "waiting" | "processing" | "success" | "failed" | null
  >(null);
  const [createdCodeId, setCreatedCodeId] = useState<string | null>(null);

  const initialState: CreateCodeFromPublicGithubFormValues = {
    url: "",
    parent_id: parentId,
  };
  const { formState, setField, updateFormState } =
    useFormReducer<CreateCodeFromPublicGithubFormValues>(initialState);

  const toastId = useRef<string | number>(undefined);

  const handleSuccess = useCallback(
    (id: string) => {
      setCreatedCodeId(id);
      unregisterRef.current = registerCallback("code", "team", id, (payload) => {
        if (payload.data.status === "waiting") {
          setProcessingStatus("waiting");
          toast.loading("Processing code version...", {
            id: sseToastId.current,
          });
        } else if (payload.data.status === "processing") {
          setProcessingStatus("processing");
          toast.loading("Processing code...", {
            id: sseToastId.current,
          });
        } else if (payload.data.status === "success") {
          setProcessingStatus("success");
          toast.success("Code version processed successfully", {
            id: sseToastId.current,
          });
          sseToastId.current = undefined;
        } else if (payload.data.status === "failed") {
          setProcessingStatus("failed");
          toast.error("Processing failed", {
            id: sseToastId.current,
          });
          sseToastId.current = undefined;
        } else {
          toast.dismiss(sseToastId.current);
          sseToastId.current = undefined;
        }
      });
    },
    [registerCallback],
  );

  useEffect(() => {
    return (): void => {
      if (sseToastId.current) {
        toast.dismiss(sseToastId.current);
      }
      if (unregisterRef.current) {
        unregisterRef.current();
      }
    };
  }, []);

  const mutation = useMutation({
    mutationFn: async (data: CreateCodeFromPublicGithubFormValues) =>
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
      setProcessingStatus(null);
      setCreatedCodeId(null);
      updateFormState({
        type: "SET_ERRORS",
        errors: { url: "Something went wrong" },
      });
    },
    onSuccess: ({ id, status, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setProcessingStatus("waiting");
      sseToastId.current = toast.loading("Code version created. Processing in background...", {
        id: toastId.current,
      });

      handleSuccess(id);
      if (status === "waiting") {
        setProcessingStatus("waiting");
        toast.loading("Processing code version...", {
          id: sseToastId.current,
        });
      } else if (status === "processing") {
        setProcessingStatus("processing");
        toast.loading("Processing code...", {
          id: sseToastId.current,
        });
      } else if (status === "success") {
        setProcessingStatus("success");
        toast.success("Code version processed successfully", {
          id: sseToastId.current,
        });
        sseToastId.current = undefined;
      }
    },
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
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

    mutation.mutate(parsed.data);
  };

  if (processingStatus === "success" && createdCodeId) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="size-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold ">Version Created Successfully!</h2>
          <p className="text-muted-foreground">
            Your contract has been uploaded and is ready for analysis.
          </p>
          <Button asChild className="mt-4">
            <Link href={`/team/${project.team.slug}/${project.slug}/codes/${createdCodeId}`}>
              View Version
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (processingStatus === "failed" && createdCodeId) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <XCircle className="size-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold">Processing Failed</h2>
          <p className="text-muted-foreground">
            The code version was created but processing failed. You can still view it or try
            creating another version.
          </p>
          <div className="flex gap-4 justify-center mt-6">
            <Button asChild variant="outline">
              <Link href={`/team/${project.team.slug}/${project.slug}/codes/${createdCodeId}`}>
                View Version
              </Link>
            </Button>
            <Button
              onClick={() => {
                mutation.reset();
                setProcessingStatus(null);
                setCreatedCodeId(null);
                updateFormState({ type: "RESET", initialValues: initialState });
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (processingStatus && createdCodeId) {
    const statusText =
      processingStatus === "waiting"
        ? "Waiting to process..."
        : processingStatus === "processing"
          ? "Processing code..."
          : "Processing...";

    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
            <div className="size-8 rounded-full bg-blue-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold">Processing Code Version</h2>
          <p className="text-muted-foreground">{statusText}</p>
          <p className="text-sm text-muted-foreground">
            This may take a few moments. You can view the version now, but it may not be fully
            processed yet.
          </p>
          <div className="flex gap-4 justify-center mt-6">
            <Button asChild variant="outline">
              <Link href={`/team/${project.team.slug}/${project.slug}/codes/${createdCodeId}`}>
                View Version
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mutation.isError) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <XCircle className="size-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold ">Upload Failed</h2>
          <p className="text-muted-foreground">
            There was an error processing your contract. Please try again.
          </p>
          <div className="flex gap-4 justify-center mt-6">
            <Button variant="outline" onClick={() => mutation.reset()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-left space-y-2">
        <div className="flex flex-row gap-4 justify-start items-center">
          <GitCommitHorizontal className="size-6 text-foreground" />
          <h2 className="text-2xl font-bold ">Public Github Repository</h2>
        </div>
        <p className="text-muted-foreground">Enter a public github solidity repository</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="url" aria-required>
              Github Repository
            </FieldLabel>
            <div className="flex flex-row gap-4 flex-wrap">
              <Input
                id="url"
                name="url"
                type="text"
                value={formState.values.url}
                onChange={(e) => setField("url", e.target.value)}
                placeholder="https://github.com/..."
                className="font-mono grow basis-1/2"
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
    </div>
  );
};

export default RepoUrlStep;
