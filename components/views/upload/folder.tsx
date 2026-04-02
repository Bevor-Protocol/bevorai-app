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
import { ArrowRight, CheckCircle, Folder, Loader2, Upload, X, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
    mutationFn: async ({
      project,
      data,
    }: FolderUploadVariables): Promise<
      CreateCodeResponse & { toInvalidate: QueryKey[]; project: ProjectDetailedSchema }
    > => {
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
        project,
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
    onSuccess: ({ id, status, toInvalidate, project, analysis_id }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Successfully uploaded code", {
        id: toastId.current,
      });

      if (status === "waiting" || status === "processing" || status === "success") {
        onSuccess?.(id);
      }

      if (analysis_id) {
        const base = `/team/${project.team.slug}/${project.slug}/analyses/${analysis_id}`;
        if (status === "waiting" || status === "processing") {
          router.push(`${base}/processing`);
        } else if (status === "success") {
          router.push(base);
        }
      }
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

  if (mutation.isSuccess && mutation.data.status === "success" && !mutation.data.analysis_id) {
    const { project: proj, id: codeId } = mutation.data;
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
            <Link href={`/team/${proj.team.slug}/${proj.slug}/codes/${codeId}`}>View Version</Link>
          </Button>
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
    <div className="max-w-5xl mx-auto space-y-8 h-full flex flex-col overflow-hidden w-full">
      <div className="flex flex-row justify-between items-end">
        <div className="text-left space-y-2">
          <div className="flex flex-row gap-4 justify-start items-center">
            <Folder className="size-6 text-yellow-400" />
            <h2 className="text-2xl font-bold ">Upload Folder</h2>
          </div>
          <p className="text-muted-foreground">Upload an entire folder of solidity files</p>
        </div>
        <Button
          type="button"
          disabled={formState.values.zip.size === 0 || mutation.isPending}
          className="min-w-40"
          onClick={handleSubmit}
        >
          <span>Submit</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        {formState.values.zip.size === 0 ? (
          <label className="w-full block mb-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 transition-colors relative",
                isDragOver
                  ? "border-purple-400 bg-purple-500/10"
                  : "border-neutral-700 hover:border-neutral-600",
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="size-12 rounded-full bg-neutral-800 flex items-center justify-center">
                  <Upload className="size-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium  mb-2">Upload folder here</h3>
                  <p className="text-muted-foreground mb-4">
                    Click here or drag and drop to upload a folder with .sol files
                  </p>
                </div>
              </div>
              <input
                type="file"
                {...{ webkitdirectory: "" }}
                accept=".sol,.js,.ts"
                onChange={handleFileInput}
                className="absolute inset-0 appearance-none cursor-pointer opacity-0"
                id="folder-upload"
              />
            </div>
          </label>
        ) : (
          <div className="flex flex-row items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{stagedFileCount}</span> file
              {stagedFileCount !== 1 ? "s" : ""} ready to upload
            </p>
            <Button variant="outline" onClick={clearAllFiles}>
              <X className="size-3" />
              Remove all
            </Button>
          </div>
        )}

        {formState.errors.zip && (
          <div className="flex items-center space-x-2 text-destructive text-sm mt-4">
            <XCircle className="size-4" />
            <span>{formState.errors.zip}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderStep;
