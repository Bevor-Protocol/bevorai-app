"use client";

import { codeActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormReducer } from "@/hooks/useFormReducer";
import { cn } from "@/lib/utils";
import type { ProjectDetailedSchema } from "@/types/api/responses/business";
import type { CreateCodeResponse } from "@/types/api/responses/graph";
import { UploadCodeFileFormValues, uploadCodeFileSchema } from "@/utils/schema";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { solidity } from "@replit/codemirror-lang-solidity";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { githubDark } from "@uiw/codemirror-theme-github";
import { basicSetup } from "codemirror";
import { ArrowRight, CheckCircle, Upload, X, XCircle } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PASTE_TEMPLATE_CODE } from "./paste";

interface SourceFile {
  file: File;
  content: string;
}

const FileStep: React.FC<{
  ensureProject: () => Promise<ProjectDetailedSchema>;
  parentId?: string;
  onSuccess?: (id: string) => void;
}> = ({ ensureProject, parentId, onSuccess }) => {
  const queryClient = useQueryClient();

  const uploadInitialState: UploadCodeFileFormValues = {
    file: undefined as unknown as File,
    parent_code_version_id: parentId,
  };
  const {
    formState: uploadFormState,
    setField: setUploadField,
    updateFormState: updateUploadFormState,
  } = useFormReducer<UploadCodeFileFormValues>(uploadInitialState);

  const uploadedFileRef = useRef<SourceFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const uploadEditorRef = useRef<HTMLDivElement>(null);
  const uploadViewRef = useRef<EditorView | null>(null);
  const uploadToastId = useRef<string | number>(undefined);

  const uploadMutation = useMutation({
    mutationFn: async (
      data: UploadCodeFileFormValues,
    ): Promise<
      CreateCodeResponse & { toInvalidate: QueryKey[]; project: ProjectDetailedSchema }
    > => {
      const project = await ensureProject();
      const r = await codeActions.contractUploadFile(project.team.slug, project.id, data);
      if (!r.ok) throw r;
      return { ...r.data, project };
    },
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
    onSuccess: ({ id, status, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Successfully uploaded code", {
        id: uploadToastId.current,
      });

      if (status === "processing" || status === "success") {
        onSuccess?.(id);
      }
    },
  });

  useEffect(() => {
    if (!uploadEditorRef.current) return;
    if (!uploadedFileRef.current) return;
    if (uploadViewRef.current) {
      uploadViewRef.current.destroy();
    }

    const code = uploadedFileRef.current.content || PASTE_TEMPLATE_CODE;
    const state = EditorState.create({
      doc: code,
      extensions: [
        basicSetup,
        solidity,
        githubDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString();
            if (uploadedFileRef.current) {
              uploadedFileRef.current.content = newContent;
            }
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: uploadEditorRef.current });
    uploadViewRef.current = view;

    return (): void => {
      if (uploadViewRef.current) {
        uploadViewRef.current.destroy();
        uploadViewRef.current = null;
      }
    };
  }, [uploadFormState.values.file]);

  const handleFileUpload = useCallback(
    async (file: File): Promise<void> => {
      if (!file.name.endsWith(".sol") && !file.name.endsWith(".js") && !file.name.endsWith(".ts")) {
        updateUploadFormState({
          type: "SET_ERRORS",
          errors: { file: "Please upload a .sol, .js, or .ts file" },
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e): void => {
        const content = e.target?.result as string;
        uploadedFileRef.current = { file, content };
        setUploadField("file", file);
        updateUploadFormState({ type: "SET_ERRORS", errors: {} });
      };
      reader.onerror = (): void =>
        updateUploadFormState({
          type: "SET_ERRORS",
          errors: { file: "Failed to read file" },
        });
      reader.readAsText(file);
    },
    [setUploadField, updateUploadFormState],
  );

  const clearUploadContent = useCallback((): void => {
    uploadedFileRef.current = null;
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
    async (e: React.DragEvent) => {
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
        await handleFileUpload(files[0]);
      }
    },
    [handleFileUpload, updateUploadFormState],
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        if (files.length > 1) {
          updateUploadFormState({
            type: "SET_ERRORS",
            errors: { file: "Please upload only one file at a time" },
          });
          return;
        }
        await handleFileUpload(files[0]);
      }
    },
    [handleFileUpload, updateUploadFormState],
  );

  const handleUploadSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    updateUploadFormState({ type: "SET_ERRORS", errors: {} });

    if (!uploadFormState.values.file || !uploadedFileRef.current) {
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

    uploadMutation.mutate(parsed.data);
  };

  if (uploadMutation.isSuccess && uploadMutation.data.status === "success") {
    const { project: proj, id: codeId } = uploadMutation.data;
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

  if (uploadMutation.isError) {
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
            <Button variant="outline" onClick={() => uploadMutation.reset()}>
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
            <Upload className="size-6 text-blue-400" />
            <h2 className="text-2xl font-bold ">Upload file</h2>
          </div>
          <p className="text-muted-foreground">Upload a .sol, .js, or .ts contract file</p>
        </div>
        <Button
          type="submit"
          disabled={!uploadedFileRef.current || uploadMutation.isPending}
          className="min-w-40"
          onClick={handleUploadSubmit}
        >
          <span>Submit</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <div className="flex flex-row justify-end items-center mb-4">
        <Button variant="outline" disabled={!uploadedFileRef.current} onClick={clearUploadContent}>
          <X className="size-3" />
          Clear
        </Button>
      </div>

      {!uploadedFileRef.current && (
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
                <h3 className="text-lg font-medium  mb-2">Upload files here</h3>
                <p className="text-muted-foreground mb-4">
                  Click here or drag and drop to upload .sol, .js, or .ts files
                </p>
              </div>
            </div>
            <Input
              type="file"
              accept=".sol,.js,.ts"
              onChange={handleFileInput}
              className="absolute inset-0 appearance-none cursor-pointer opacity-0"
              id="file-upload"
            />
          </div>
        </label>
      )}
      {uploadedFileRef.current && (
        <div className="border border-border rounded-lg min-h-20 overflow-scroll">
          <div ref={uploadEditorRef} role="region" aria-label="Solidity code editor" />
        </div>
      )}

      {uploadFormState.errors.file && (
        <div className="flex items-center space-x-2 text-destructive text-sm mt-4">
          <XCircle className="size-4" />
          <span>{uploadFormState.errors.file}</span>
        </div>
      )}

      <style>{`
        .cm-editor { background-color: black !important }
        .cm-activeLine,.cm-activeLineGutter { background-color: transparent !important; }
        .cm-gutters {background-color: black !important;}
        .cm-gutter {background-color: black !important;}
        .cm-gutterElement {color: #8b949e !important;}
        .cm-editor { height: 100% !important; }
        .cm-scroller { overflow: auto !important; }
        .cm-selectionBackground {background: white !important; }
      `}</style>
    </div>
  );
};

export default FileStep;
