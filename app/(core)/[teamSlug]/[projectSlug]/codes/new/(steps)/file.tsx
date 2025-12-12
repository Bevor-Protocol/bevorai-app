"use client";

import { codeActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFormReducer } from "@/hooks/useFormReducer";
import { cn } from "@/lib/utils";
import {
  PasteCodeFileFormValues,
  UploadCodeFileFormValues,
  pasteCodeFileSchema,
  uploadCodeFileSchema,
} from "@/utils/schema";
import { ProjectDetailedSchemaI } from "@/utils/types";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { solidity } from "@replit/codemirror-lang-solidity";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { githubDark } from "@uiw/codemirror-theme-github";
import { basicSetup } from "codemirror";
import { ArrowRight, CheckCircle, Upload, X, XCircle } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const templateCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract ExampleContract {}`;

interface SourceFile {
  file: File;
  content: string;
}

const FileStep: React.FC<{
  project: ProjectDetailedSchemaI;
  parentId?: string;
  connect: (url?: string) => void;
}> = ({ project, parentId, connect }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");

  const uploadInitialState: UploadCodeFileFormValues = {
    file: undefined as unknown as File,
    parent_id: parentId,
  };
  const {
    formState: uploadFormState,
    setField: setUploadField,
    updateFormState: updateUploadFormState,
  } = useFormReducer<UploadCodeFileFormValues>(uploadInitialState);

  const pasteInitialState: PasteCodeFileFormValues = {
    content: templateCode,
    parent_id: parentId,
  };
  const {
    formState: pasteFormState,
    setField: setPasteField,
    updateFormState: updatePasteFormState,
  } = useFormReducer<PasteCodeFileFormValues>(pasteInitialState);

  const uploadedFileRef = useRef<SourceFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const uploadEditorRef = useRef<HTMLDivElement>(null);
  const pasteEditorRef = useRef<HTMLDivElement>(null);
  const uploadViewRef = useRef<EditorView | null>(null);
  const pasteViewRef = useRef<EditorView | null>(null);
  const uploadToastId = useRef<string | number>(undefined);
  const pasteToastId = useRef<string | number>(undefined);

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadCodeFileFormValues) =>
      codeActions.contractUploadFile(project.team.slug, project.id, data),
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

      if (status === "embedding" || status === "pending") {
        connect(`/code-versions/${id}`);
      }
    },
  });

  const pasteMutation = useMutation({
    mutationFn: async (data: PasteCodeFileFormValues) =>
      codeActions.contractUploadPaste(project.team.slug, project.id, data),
    onMutate: () => {
      updatePasteFormState({ type: "SET_ERRORS", errors: {} });
      pasteToastId.current = toast.loading("Uploading and parsing code...");
    },
    onError: () => {
      toast.dismiss(pasteToastId.current);
      updatePasteFormState({
        type: "SET_ERRORS",
        errors: { code: "Something went wrong" },
      });
    },
    onSuccess: ({ id, status, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Successfully uploaded code", {
        id: pasteToastId.current,
      });

      if (status === "embedding" || status === "pending") {
        connect(`/code-versions/${id}`);
      }
    },
  });

  useEffect(() => {
    if (activeTab !== "upload" || !uploadEditorRef.current) return;
    if (uploadViewRef.current) {
      uploadViewRef.current.destroy();
    }

    const code = uploadedFileRef.current?.content || templateCode;
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
  }, [activeTab, uploadFormState.values.file]);

  useEffect(() => {
    if (activeTab !== "paste" || !pasteEditorRef.current) return;
    if (pasteViewRef.current) {
      pasteViewRef.current.destroy();
    }

    const state = EditorState.create({
      doc: pasteFormState.values.content,
      extensions: [
        basicSetup,
        solidity,
        githubDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setPasteField("content", update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: pasteEditorRef.current });
    pasteViewRef.current = view;

    return (): void => {
      if (pasteViewRef.current) {
        pasteViewRef.current.destroy();
        pasteViewRef.current = null;
      }
    };
  }, [activeTab, pasteFormState.values.content, setPasteField]);

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

  const clearPasteContent = useCallback((): void => {
    setPasteField("content", templateCode);
    updatePasteFormState({ type: "SET_ERRORS", errors: {} });
  }, [setPasteField, updatePasteFormState]);

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

  const handlePasteSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    updatePasteFormState({ type: "SET_ERRORS", errors: {} });

    const parsed = pasteCodeFileSchema.safeParse(pasteFormState.values);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path) {
          fieldErrors[path] = issue.message;
        }
      });
      updatePasteFormState({ type: "SET_ERRORS", errors: fieldErrors });
      return;
    }

    pasteMutation.mutate(parsed.data);
  };

  const handleToggle = (value: string): void => {
    setActiveTab(value as "upload" | "paste");
    if (value === "upload") {
      uploadedFileRef.current = null;
      setUploadField("file", undefined as unknown as File);
      updateUploadFormState({ type: "SET_ERRORS", errors: {} });
    } else {
      setPasteField("content", templateCode);
      updatePasteFormState({ type: "SET_ERRORS", errors: {} });
    }
  };

  const currentMutation = activeTab === "upload" ? uploadMutation : pasteMutation;

  if (currentMutation.isSuccess) {
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
            <Link href={`/${project.team.slug}/${project.slug}/codes/${currentMutation.data.id}`}>
              View Version
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (currentMutation.isError) {
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
            <Button variant="outline" onClick={() => currentMutation.reset()}>
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
            <h2 className="text-2xl font-bold ">Smart Contract File</h2>
          </div>
          <p className="text-muted-foreground">
            Write, paste, or upload your Solidity contract code below
          </p>
        </div>
        <Button
          type="submit"
          disabled={
            activeTab === "upload"
              ? !uploadedFileRef.current || uploadMutation.isPending
              : !pasteFormState.values.content.trim() || pasteMutation.isPending
          }
          className="min-w-40"
          onClick={activeTab === "upload" ? handleUploadSubmit : handlePasteSubmit}
        >
          <span>Submit</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <Tabs onValueChange={handleToggle} value={activeTab}>
        <div className="flex flex-row justify-between items-center">
          <TabsList>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="paste">Write</TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            disabled={
              activeTab === "upload"
                ? !uploadedFileRef.current
                : !pasteFormState.values.content.trim()
            }
            onClick={activeTab === "upload" ? clearUploadContent : clearPasteContent}
          >
            <X className="size-3" />
            Clear
          </Button>
        </div>
        <TabsContent value="upload">
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
                      Click here or drag and drop to upload .sol files
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
        </TabsContent>
        <TabsContent value="paste">
          <div className="border border-border rounded-lg min-h-20 overflow-scroll">
            <div ref={pasteEditorRef} role="region" aria-label="Solidity code editor" />
          </div>
          {pasteFormState.errors.code && (
            <div className="flex items-center space-x-2 text-destructive text-sm mt-4">
              <XCircle className="size-4" />
              <span>{pasteFormState.errors.code}</span>
            </div>
          )}
        </TabsContent>
      </Tabs>
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
