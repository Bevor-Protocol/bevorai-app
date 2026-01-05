"use client";

import { codeActions, githubActions, projectActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormReducer } from "@/hooks/useFormReducer";
import { useSSE } from "@/providers/sse";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { CreateCodeFromGithubFormValues, createCodeFromGithubSchema } from "@/utils/schema";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle, GitBranch, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

const GithubRepoStep: React.FC<{
  teamSlug: string;
  projectSlug: string;
  parentId?: string;
}> = ({ teamSlug, projectSlug, parentId }) => {
  const queryClient = useQueryClient();
  const { registerCallback } = useSSE();
  const sseToastId = React.useRef<string | number | undefined>(undefined);
  const unregisterRef = React.useRef<() => void | undefined>(undefined);
  const [processingStatus, setProcessingStatus] = React.useState<
    "waiting" | "parsing" | "embedding" | "success" | "failed" | null
  >(null);
  const [createdCodeId, setCreatedCodeId] = React.useState<string | null>(null);

  const { data: project } = useSuspenseQuery({
    queryKey: generateQueryKey.project(projectSlug),
    queryFn: async () =>
      projectActions.getProject(teamSlug, projectSlug).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const initialFormState: CreateCodeFromGithubFormValues = {
    branch: undefined,
    commit: undefined,
    parent_id: parentId,
  };

  const { formState, setField, updateFormState } =
    useFormReducer<CreateCodeFromGithubFormValues>(initialFormState);
  const { data: branches } = useQuery({
    queryKey: [QUERY_KEYS.GITHUB_BRANCHES, project.github_repo_id],
    queryFn: () =>
      githubActions.getBranches(project.github_repo_id!).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    enabled: !!project.github_repo_id,
  });

  const handleSuccess = React.useCallback(
    (id: string) => {
      setCreatedCodeId(id);
      unregisterRef.current = registerCallback("code", "team", id, (payload) => {
        if (payload.data.status === "waiting") {
          setProcessingStatus("waiting");
          toast.loading("Processing code version...", {
            id: sseToastId.current,
          });
        } else if (payload.data.status === "parsing") {
          setProcessingStatus("parsing");
          toast.loading("Parsing code...", {
            id: sseToastId.current,
          });
        } else if (payload.data.status === "parsed" || payload.data.status === "embedding") {
          setProcessingStatus("embedding");
          toast.loading("Embedding code...", {
            id: sseToastId.current,
          });
        } else if (payload.data.status === "success") {
          setProcessingStatus("success");
          toast.success("Code version processed successfully", {
            id: sseToastId.current,
          });
          sseToastId.current = undefined;
        } else if (
          payload.data.status === "failed_parsing" ||
          payload.data.status === "failed_embedding"
        ) {
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

  React.useEffect(() => {
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
    mutationFn: async (data: CreateCodeFromGithubFormValues) =>
      codeActions.createCodeConnectedGithub(project.team.slug, project.id, data).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onMutate: () => {
      updateFormState({ type: "SET_ERRORS", errors: {} });
      sseToastId.current = toast.loading("Creating code version from repository...");
    },
    onError: () => {
      toast.error("Failed to create code version", {
        id: sseToastId.current,
      });
      setProcessingStatus(null);
      setCreatedCodeId(null);
      updateFormState({
        type: "SET_ERRORS",
        errors: { commit: "Something went wrong" },
      });
    },
    onSuccess: ({ id, status, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setProcessingStatus("waiting");
      toast.loading("Code version created. Processing in background...", {
        id: sseToastId.current,
      });

      handleSuccess(id);
      if (status === "waiting") {
        setProcessingStatus("waiting");
        toast.loading("Processing code version...", {
          id: sseToastId.current,
        });
      } else if (status === "parsing") {
        setProcessingStatus("parsing");
        toast.loading("Parsing code...", {
          id: sseToastId.current,
        });
      } else if (status === "parsed" || status === "embedding") {
        setProcessingStatus("embedding");
        toast.loading("Embedding code...", {
          id: sseToastId.current,
        });
      } else if (status === "success") {
        setProcessingStatus("success");
        toast.success("Code version processed successfully", {
          id: sseToastId.current,
        });
        sseToastId.current = undefined;
      } else if (status === "failed_parsing" || status === "failed_embedding") {
        setProcessingStatus("failed");
        toast.error("Processing failed", {
          id: sseToastId.current,
        });
        sseToastId.current = undefined;
      }
    },
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    updateFormState({ type: "SET_ERRORS", errors: {} });

    if (!formState.values.branch && !formState.values.commit) {
      updateFormState({
        type: "SET_ERRORS",
        errors: { branch: "Please select a branch or enter a commit SHA" },
      });
      return;
    }

    const parsed = createCodeFromGithubSchema.safeParse(formState.values);

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

  const handleBranchClick = (branchName: string): void => {
    if (formState.values.branch === branchName) {
      setField("branch", undefined);
    } else {
      setField("branch", branchName);
      setField("commit", undefined);
    }
  };

  if (mutation.isSuccess && createdCodeId) {
    if (processingStatus === "success") {
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
              <Link href={`/team/${project.team.slug}/${project.slug}/codes/${mutation.data.id}`}>
                View Version
              </Link>
            </Button>
          </div>
        </div>
      );
    }

    if (processingStatus === "failed") {
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
                  updateFormState({ type: "RESET", initialValues: initialFormState });
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    const statusText =
      processingStatus === "waiting"
        ? "Waiting to process..."
        : processingStatus === "parsing"
          ? "Parsing code..."
          : processingStatus === "embedding"
            ? "Embedding code..."
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
          <h2 className="text-2xl font-bold">Import Failed</h2>
          <p className="text-muted-foreground">
            There was an error importing code from the repository. Please try again.
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
    <div className="max-w-5xl mx-auto space-y-8 w-full">
      <div className="flex flex-row justify-between items-end">
        <div className="text-left space-y-4">
          <div className="flex flex-row gap-4 justify-start items-center">
            <GitBranch className="size-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Create Code Version</h2>
          </div>
          <div className="space-y-2">
            {project.github_repo && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Connected repository:</span>
                <a
                  href={project.github_repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted border text-xs font-mono hover:bg-muted/80 transition-colors"
                >
                  <div className="relative size-4 shrink-0">
                    <Image
                      src={project.github_repo.account.avatar_url}
                      alt={project.github_repo.account.login}
                      fill
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  </div>
                  <span className="font-medium">{project.github_repo.full_name}</span>
                  {project.github_repo.is_private && (
                    <span className="text-[10px] opacity-70">• Private</span>
                  )}
                </a>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Push events to this repository are automatically processed. You can also manually
              import code from a specific branch or commit below.
            </p>
          </div>
        </div>
        <Button
          type="submit"
          disabled={mutation.isPending || (!formState.values.branch && !formState.values.commit)}
          className="min-w-40"
          onClick={handleSubmit}
        >
          <span>Create Version</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>Branch</Label>
          {branches && branches.branches_info.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {branches.branches_info.map((branch) => {
                const isSelected = formState.values.branch === branch.name;
                return (
                  <Button
                    key={branch.name}
                    type="button"
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleBranchClick(branch.name)}
                    className="font-mono text-xs"
                  >
                    <GitBranch className="size-3" />
                    {branch.name}
                  </Button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading branches...</p>
          )}
          {formState.errors.branch && (
            <div className="flex items-center space-x-2 text-destructive text-sm">
              <XCircle className="size-4" />
              <span>{formState.errors.branch}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Commit SHA</Label>
          <Input
            type="text"
            placeholder="Enter commit SHA (short or long format)"
            value={formState.values.commit || ""}
            onChange={(e) => {
              setField("commit", e.target.value);
              if (e.target.value) {
                setField("branch", undefined);
              }
            }}
            className="font-mono max-w-96"
          />
          <p className="text-xs text-muted-foreground">
            Specify a commit SHA to import a specific commit. This will override branch selection.
          </p>
          {formState.errors.commit && (
            <div className="flex items-center space-x-2 text-destructive text-sm">
              <XCircle className="size-4" />
              <span>{formState.errors.commit}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default GithubRepoStep;
