"use client";

import { codeActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFormReducer } from "@/hooks/useFormReducer";
import { cn } from "@/lib/utils";
import type { ProjectDetailedSchema } from "@/types/api/responses/business";
import { UploadCodeFileFormValues, uploadCodeFileSchema } from "@/utils/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, FileIcon, Loader2, Upload, X, XCircle } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

type FileUploadVariables = {
  project: ProjectDetailedSchema;
  data: UploadCodeFileFormValues;
};

const startFileCodeUpload = async (
  ensureProject: (tags: string[]) => Promise<ProjectDetailedSchema>,
  tags: string[],
  data: UploadCodeFileFormValues,
  mutate: (vars: FileUploadVariables) => void,
): Promise<void> => {
  const project = await ensureProject(tags);
  mutate({ project, data });
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileStep: React.FC<{
  ensureProject: (tags: string[]) => Promise<ProjectDetailedSchema>;
  parentId?: string;
  parentAnalysisId?: string;
  onSuccess?: (id: string) => void;
}> = ({ ensureProject, parentId, parentAnalysisId, onSuccess }) => {
  const queryClient = useQueryClient();

  const uploadInitialState: UploadCodeFileFormValues = {
    file: undefined as unknown as File,
    parent_code_version_id: parentId,
    parent_analysis_id: parentAnalysisId,
  };
  const {
    formState: uploadFormState,
    setField: setUploadField,
    updateFormState: updateUploadFormState,
  } = useFormReducer<UploadCodeFileFormValues>(uploadInitialState);

  const [isDragOver, setIsDragOver] = useState(false);
  const uploadToastId = useRef<string | number>(undefined);

  const stagedFile = uploadFormState.values.file;

  const uploadMutation = useMutation({
    mutationFn: async ({ project, data }: FileUploadVariables) =>
      codeActions.contractUploadFile(project.team.slug, project.id, data).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onMutate: () => {
      updateUploadFormState({ type: "SET_ERRORS", errors: {} });
      uploadToastId.current = toast.loading("Uploading and parsing code...");
    },
    onError: () => {
      toast.dismiss(uploadToastId.current);
      updateUploadFormState({
        type: "SET_ERRORS",
        errors: { file: "Something went wrong" },
      });
    },
    onSuccess: ({ analysis_id, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Successfully uploaded code", {
        id: uploadToastId.current,
      });

      if (analysis_id) onSuccess?.(analysis_id);
    },
  });

  const handleFileUpload = useCallback(
    (file: File): void => {
      if (!file.name.endsWith(".sol") && !file.name.endsWith(".js") && !file.name.endsWith(".ts")) {
        updateUploadFormState({
          type: "SET_ERRORS",
          errors: { file: "Please upload a .sol, .js, or .ts file" },
        });
        return;
      }

      setUploadField("file", file);
      updateUploadFormState({ type: "SET_ERRORS", errors: {} });
    },
    [setUploadField, updateUploadFormState],
  );

  const clearUploadContent = useCallback((): void => {
    setUploadField("file", undefined as unknown as File);
    updateUploadFormState({ type: "SET_ERRORS", errors: {} });
  }, [setUploadField, updateUploadFormState]);

  const handleDragOver = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent): void => {
      e.preventDefault();
      setIsDragOver(false);
      updateUploadFormState({ type: "SET_ERRORS", errors: {} });

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
        if (files.length > 1) {
          updateUploadFormState({
            type: "SET_ERRORS",
            errors: { file: "Please upload only one file at a time" },
          });
          return;
        }
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload, updateUploadFormState],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const files = e.target.files;
      if (files && files.length > 0) {
        if (files.length > 1) {
          updateUploadFormState({
            type: "SET_ERRORS",
            errors: { file: "Please upload only one file at a time" },
          });
          return;
        }
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload, updateUploadFormState],
  );

  const handleUploadSubmit = (): void => {
    updateUploadFormState({ type: "SET_ERRORS", errors: {} });

    if (!stagedFile) {
      updateUploadFormState({
        type: "SET_ERRORS",
        errors: { file: "Please upload a file" },
      });
      return;
    }

    const parsed = uploadCodeFileSchema.safeParse(uploadFormState.values);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path) {
          fieldErrors[path] = issue.message;
        }
      });
      updateUploadFormState({ type: "SET_ERRORS", errors: fieldErrors });
      return;
    }

    void startFileCodeUpload(ensureProject, ["file"], parsed.data, uploadMutation.mutate).catch(
      () => {},
    );
  };

  const uploadData = uploadMutation.data;
  const showOpeningAnalysis =
    uploadMutation.isSuccess &&
    !!uploadData?.analysis_id &&
    (uploadData.status === "waiting" ||
      uploadData.status === "processing" ||
      uploadData.status === "success");

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <Upload className="size-5 shrink-0 text-blue-400" aria-hidden />
          <DialogTitle>Upload file</DialogTitle>
        </div>
        <DialogDescription>
          One contract file at a time (.sol). Drag and drop or choose from disk.
        </DialogDescription>
      </DialogHeader>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        {showOpeningAnalysis ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Opening analysis…</p>
          </div>
        ) : uploadMutation.isError ? (
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
                <Button variant="outline" onClick={() => uploadMutation.reset()}>
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        ) : !stagedFile ? (
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
                <p className="text-base font-medium">Choose a file</p>
                <p className="text-sm text-muted-foreground">
                  Click this area or drop a single .sol file here.
                </p>
              </div>
              <Input
                type="file"
                accept=".sol"
                onChange={handleFileInput}
                className="absolute inset-0 cursor-pointer opacity-0"
                id="file-upload"
              />
            </div>
          </label>
        ) : (
          <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/15 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background/80">
                <FileIcon className="size-5 text-muted-foreground" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium text-foreground">Ready to upload</p>
                <p className="truncate font-mono text-sm text-foreground" title={stagedFile.name}>
                  {stagedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">{formatFileSize(stagedFile.size)}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={clearUploadContent}
                disabled={uploadMutation.isPending}
              >
                <X className="size-3.5" />
                Remove file
              </Button>
              <Button
                type="button"
                className="w-full min-w-40 sm:w-auto"
                disabled={uploadMutation.isPending}
                onClick={handleUploadSubmit}
              >
                <span>Submit</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {!showOpeningAnalysis && !uploadMutation.isError && uploadFormState.errors.file && (
          <div className="flex shrink-0 items-start gap-2 text-sm text-destructive">
            <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{uploadFormState.errors.file}</span>
          </div>
        )}
      </div>
    </>
  );
};

export default FileStep;
