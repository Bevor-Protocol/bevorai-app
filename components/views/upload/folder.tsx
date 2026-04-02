"use client";

import { authActions, tokenActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { useFormReducer } from "@/hooks/useFormReducer";
import { cn } from "@/lib/utils";
import { isApiError } from "@/types/api";
import type { ProjectDetailedSchema } from "@/types/api/responses/business";
import type { CreateCodeResponse } from "@/types/api/responses/graph";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { handleMutationError } from "@/utils/helpers";
import { UploadCodeFolderFormValues, uploadCodeFolderSchema } from "@/utils/schema";
import { QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { zipSync } from "fflate";
import { ArrowRight, Folder, Loader2, Upload, X, XCircle } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

const zipFiles = async (files: File[]): Promise<Uint8Array> => {
  const zip: Record<string, Uint8Array> = {};

  for (const file of files) {
    const path = file.webkitRelativePath || file.name;
    zip[path] = new Uint8Array(await file.arrayBuffer());
  }

  return zipSync(zip, { level: 6 });
};

type FolderUploadVariables = {
  project: ProjectDetailedSchema;
  data: UploadCodeFolderFormValues;
};

const startFolderCodeUpload = async (
  ensureProject: () => Promise<ProjectDetailedSchema>,
  data: UploadCodeFolderFormValues,
  mutate: (vars: FolderUploadVariables) => void,
): Promise<void> => {
  const project = await ensureProject();
  mutate({ project, data });
};

const isValidFile = (file: File): boolean => {
  const path = (file.webkitRelativePath || file.name).replace(/\\/g, "/");
  const pathSegments = path.split("/");
  const fileName = pathSegments[pathSegments.length - 1]?.toLowerCase() ?? "";

  if (pathSegments.includes(".git") || pathSegments.includes(".github")) return false;
  if (fileName.startsWith(".env")) return false;
  return true;
};

const FolderStep: React.FC<{
  ensureProject: () => Promise<ProjectDetailedSchema>;
  parentId?: string;
  onSuccess?: (id: string) => void;
}> = ({ ensureProject, parentId, onSuccess }) => {
  const queryClient = useQueryClient();

  const initialState: UploadCodeFolderFormValues = {
    zip: new Blob(),
    parent_code_version_id: parentId,
  };
  const { formState, setField, updateFormState } =
    useFormReducer<UploadCodeFolderFormValues>(initialState);

  const [stagedFileCount, setStagedFileCount] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const toastId = useRef<string | number>(undefined);

  const mutation = useMutation({
    mutationFn: async ({ project, data }: FolderUploadVariables) => {
      const [apiBaseUrl, signingToken] = await Promise.all([
        authActions.getBaseUrl(),
        tokenActions
          .getSigningToken(project.team.slug, project.id, {
            parent_code_version_id: data.parent_code_version_id,
            analyze: true,
          })
          .then((r) => {
            if (!r.ok) throw r;
            return r.data;
          }),
      ]);

      const toInvalidate: QueryKey[] = [
        [QUERY_KEYS.ANALYSES],
        [QUERY_KEYS.CODES, project.team.slug],
      ];
      const searchParams = new URLSearchParams({ signing_key: signingToken });
      if (data.parent_code_version_id) {
        toInvalidate.push(generateQueryKey.codeRelations(data.parent_code_version_id));
      }

      const response = await fetch(
        `${apiBaseUrl}/graph/versions/folder?${searchParams.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/zip",
          },
          body: data.zip,
        },
      );
      const responseData = await response.json();

      const requestId = response.headers.get("bevor-request-id") ?? "";

      if (!response.ok) {
        throw {
          ok: false as const,
          error: responseData ?? { message: "Failed to upload folder" },
          requestId,
        };
      }

      if (!responseData || typeof responseData !== "object") {
        throw {
          ok: false as const,
          error: { message: "Invalid upload response from API" },
          requestId,
        };
      }

      return {
        ...(responseData as CreateCodeResponse),
        toInvalidate,
      };
    },
    onMutate: () => {
      updateFormState({ type: "SET_ERRORS", errors: {} });
      toastId.current = toast.loading("Uploading code...");
    },
    onError: (err) => {
      if (isApiError(err)) {
        handleMutationError({ err, toastId: toastId.current, message: "Something went wrong" });
      } else {
        toast.dismiss(toastId.current);
      }
      updateFormState({
        type: "SET_ERRORS",
        errors: { zip: "Something went wrong" },
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

  const processFiles = useCallback(
    async (fileList: File[] | FileList) => {
      const validFiles = Array.from(fileList).filter((file) => isValidFile(file));

      if (validFiles.length === 0) {
        updateFormState({
          type: "SET_ERRORS",
          errors: { zip: "No valid .sol, .js, or .ts files found in the folder" },
        });
        return;
      }

      const zipData = await zipFiles(validFiles);
      const zipBlob = new Blob([new Uint8Array(zipData)], { type: "application/zip" });
      setField("zip", zipBlob);
      setStagedFileCount(validFiles.length);
      updateFormState({ type: "SET_ERRORS", errors: {} });
    },
    [setField, updateFormState],
  );

  const clearAllFiles = useCallback(() => {
    setField("zip", new Blob());
    setStagedFileCount(0);
    updateFormState({ type: "SET_ERRORS", errors: {} });
  }, [setField, updateFormState]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      updateFormState({ type: "SET_ERRORS", errors: {} });

      const items = Array.from(e.dataTransfer.items);
      const files: File[] = [];

      for (const item of items) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }

      if (files.length > 0) {
        await processFiles(files);
      }
    },
    [processFiles, updateFormState],
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        await processFiles(files);
      }
    },
    [processFiles],
  );

  const handleSubmit = (): void => {
    updateFormState({ type: "SET_ERRORS", errors: {} });

    const parsed = uploadCodeFolderSchema.safeParse(formState.values);

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

    void startFolderCodeUpload(ensureProject, parsed.data, mutation.mutate).catch(() => {});
  };

  if (mutation.isSuccess) {
    const { status, analysis_id: analysisId } = mutation.data;
    if (analysisId && (status === "waiting" || status === "processing" || status === "success")) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Opening analysis…</p>
        </div>
      );
    }
  }

  if (mutation.isError) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <XCircle className="size-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold ">Upload Failed</h2>
          <p className="text-muted-foreground">There was an error processing your contract.</p>
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
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-6 overflow-hidden">
      <header className="space-y-1.5">
        <div className="flex items-center gap-3">
          <Folder className="size-6 shrink-0 text-yellow-400" aria-hidden />
          <h2 className="text-2xl font-bold tracking-tight">Upload folder</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Select a folder containing .sol, .js, or .ts files. Hidden paths like{" "}
          <span className="font-mono text-xs">.git</span> are skipped.
        </p>
      </header>

      {formState.values.zip.size === 0 ? (
        <label className="block w-full cursor-pointer">
          <div
            className={cn(
              "relative flex min-h-[min(40vh,320px)] flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-colors",
              isDragOver
                ? "border-purple-400 bg-purple-500/10"
                : "border-neutral-700 hover:border-neutral-600 hover:bg-muted/20",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-neutral-800">
              <Upload className="size-7 text-muted-foreground" aria-hidden />
            </div>
            <div className="max-w-md space-y-1 text-center">
              <p className="text-base font-medium">Choose a folder to upload</p>
              <p className="text-sm text-muted-foreground">
                Click this area or drag files from a folder. Your browser will ask you to pick a
                directory.
              </p>
            </div>
            <input
              type="file"
              {...{ webkitdirectory: "" }}
              accept=".sol,.js,.ts"
              onChange={handleFileInput}
              className="absolute inset-0 cursor-pointer opacity-0"
              id="folder-upload"
            />
          </div>
        </label>
      ) : (
        <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/15 p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">Ready to upload</p>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">{stagedFileCount}</span>{" "}
              file{stagedFileCount !== 1 ? "s" : ""} will be zipped and sent for indexing.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={clearAllFiles}
              disabled={mutation.isPending}
            >
              <X className="size-3.5" />
              Remove all
            </Button>
            <Button
              type="button"
              className="w-full min-w-40 sm:w-auto"
              disabled={mutation.isPending}
              onClick={handleSubmit}
            >
              <span>Submit</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {formState.errors.zip && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{formState.errors.zip}</span>
        </div>
      )}
    </div>
  );
};

export default FolderStep;
