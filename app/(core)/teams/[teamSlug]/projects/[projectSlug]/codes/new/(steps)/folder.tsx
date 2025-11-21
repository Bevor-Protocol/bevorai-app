"use client";

import { codeActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { useSSE } from "@/hooks/useSSE";
import { cn } from "@/lib/utils";
import { ProjectDetailedSchemaI } from "@/utils/types";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { solidity } from "@replit/codemirror-lang-solidity";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { githubDark } from "@uiw/codemirror-theme-github";
import { basicSetup } from "codemirror";
import { ArrowRight, CheckCircle, FileText, Folder, Upload, X, XCircle } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface SourceFile {
  path: string;
  content: string;
  file: File;
}

const FolderStep: React.FC<{
  project: ProjectDetailedSchemaI;
}> = ({ project }) => {
  const queryClient = useQueryClient();

  const [sourceFiles, setSourceFiles] = useState<SourceFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<SourceFile | null>(null);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const toastId = useRef<string | number>(undefined);
  const sseToastId = useRef<string | number | undefined>(undefined);

  const { connect } = useSSE({
    autoConnect: false,
    eventTypes: ["code_versions"],
    onMessage: (message) => {
      let parsed: string;
      try {
        parsed = JSON.parse(message.data);
      } catch {
        parsed = message.data;
      }

      if (parsed === "pending" || parsed === "embedding") {
        sseToastId.current = toast.loading("Post-processing code...");
      }

      if (parsed === "embedded") {
        toast.success("Post-processing successful", {
          id: sseToastId.current,
        });
        sseToastId.current = undefined;
      } else if (parsed === "failed") {
        toast.error("Post-processing failed", {
          id: sseToastId.current,
        });
        sseToastId.current = undefined;
      }
    },
  });

  const mutation = useMutation({
    mutationFn: async (files: SourceFile[]) => {
      const fileMap: Record<string, File> = {};
      files.forEach((sourceFile) => {
        fileMap[sourceFile.path] = sourceFile.file;
      });
      return codeActions.contractUploadFolder(project.team.slug, project.slug, fileMap);
    },
    onMutate: () => {
      setError("");
      toastId.current = toast.loading("Uploading and parsing code...");
    },
    onError: () => {
      toast.dismiss(toastId.current);
      setError("something went wrong");
    },
    onSuccess: ({ id, status, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Successfully uploaded code", {
        id: toastId.current,
      });

      if (status === "embedding" || status === "pending") {
        connect(`/code-versions/${id}`);
      }
    },
  });

  useEffect(() => {
    if (!editorRef.current || !selectedFile || mutation.isPending || mutation.data) return;
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const state = EditorState.create({
      doc: selectedFile.content,
      extensions: [basicSetup, solidity, githubDark],
    });

    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;

    return (): void => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [selectedFile, mutation.isPending, mutation.data]);

  const processFiles = useCallback(async (files: File[] | FileList) => {
    const validFiles: SourceFile[] = [];

    for (const file of Array.from(files)) {
      if (file.name.endsWith(".sol") || file.name.endsWith(".js") || file.name.endsWith(".ts")) {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e): void => resolve(e.target?.result as string);
          reader.onerror = (): void => reject(new Error("Failed to read file"));
          reader.readAsText(file);
        });

        validFiles.push({
          path: file.webkitRelativePath || file.name,
          content,
          file,
        });
      }
    }

    if (validFiles.length === 0) {
      setError("No valid .sol, .js, or .ts files found in the folder");
      return;
    }

    setSourceFiles(validFiles);
    setSelectedFile(validFiles[0]);
    setError("");
  }, []);

  const clearAllFiles = useCallback(() => {
    setSourceFiles([]);
    setSelectedFile(null);
    setError("");
  }, []);

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
      setError("");

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
    [processFiles],
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

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    if (sourceFiles.length === 0) {
      setError("Please upload a folder with contract files");
      return;
    }

    setError("");
    mutation.mutate(sourceFiles);
  };

  if (mutation.isSuccess) {
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
            <Link
              href={`/teams/${project.team.slug}/projects/${project.slug}/codes/${mutation.data.id}`}
            >
              View Version
            </Link>
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
            <XCircle className="size-8 text-red-400" />
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
          type="submit"
          disabled={sourceFiles.length === 0 || mutation.isPending}
          className="min-w-40"
          onClick={handleSubmit}
        >
          <span>Submit</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        {sourceFiles.length === 0 ? (
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
          <div className="flex flex-row justify-end mb-4">
            <Button variant="outline" onClick={clearAllFiles}>
              <X className="size-3" />
              Remove All
            </Button>
          </div>
        )}

        {sourceFiles.length > 0 && (
          <div className="grow border border-border rounded-lg overflow-hidden flex flex-col">
            <div
              className="grid flex-1 h-full"
              style={{ gridTemplateColumns: "250px 1fr", gridTemplateRows: "auto 1fr" }}
            >
              <div className="flex items-center space-x-2 p-3 border-b border-r border-border">
                <span className="text-sm font-medium ">Sources</span>
                <span className="text-xs text-neutral-500">({sourceFiles.length})</span>
              </div>
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="flex items-center space-x-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium ">
                    {selectedFile ? selectedFile.path.split("/").pop() : "No file selected"}
                  </span>
                  {selectedFile && (
                    <span className="text-xs text-neutral-500">{selectedFile.path}</span>
                  )}
                </div>
              </div>
              <div className="border-r border-border overflow-y-auto min-h-0">
                {sourceFiles.map((sourceFile) => (
                  <div key={sourceFile.path} className="space-y-1">
                    <div
                      className={cn(
                        "px-3 py-2 rounded-lg transition-colors flex justify-center flex-col cursor-pointer",
                        selectedFile?.path === sourceFile.path
                          ? "bg-neutral-800 "
                          : " hover:bg-neutral-800/50",
                      )}
                      onClick={() => setSelectedFile(sourceFile)}
                    >
                      <span className="text-sm font-medium truncate">
                        {sourceFile.path.split("/").pop()}
                      </span>
                      <div className="text-xs text-neutral-500 truncate">{sourceFile.path}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
                {selectedFile ? (
                  <div className="border border-border rounded-lg h-full overflow-scroll">
                    <div ref={editorRef} role="region" aria-label="Solidity code editor" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-500">
                    Select a source file to view code
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-red-400 text-sm mt-4">
            <XCircle className="size-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

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

export default FolderStep;
