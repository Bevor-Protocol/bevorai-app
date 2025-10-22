"use client";

import { versionActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { navigation } from "@/utils/navigation";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { solidity } from "@replit/codemirror-lang-solidity";
import { useMutation } from "@tanstack/react-query";
import { githubDark } from "@uiw/codemirror-theme-github";
import { basicSetup } from "codemirror";
import { ArrowRight, CheckCircle, Code, FileText, Upload, X, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface FileStepStepProps {
  projectId: string;
  params: { teamId: string; projectId: string };
}
interface SourceFile {
  path: string;
  content: string;
  file: File;
}

const FolderStep: React.FC<FileStepStepProps> = ({ projectId, params }) => {
  const [sourceFiles, setSourceFiles] = useState<SourceFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<SourceFile | null>(null);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const { mutate, isSuccess, isPending } = useMutation({
    mutationFn: async (files: SourceFile[]) => {
      const fileMap: Record<string, File> = {};
      files.forEach((sourceFile) => {
        fileMap[sourceFile.path] = sourceFile.file;
      });
      return versionActions.contractUploadFolder({ fileMap, projectId });
    },
    onError: () => {
      setError("Failed to upload contract folder");
    },
    onSuccess: (result) => {
      setTimeout(() => {
        router.push(
          navigation.project.versions.overview({ ...params, versionId: result.version_id }),
        );
      }, 1000);
    },
  });

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current || !selectedFile) return;
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
  }, [selectedFile]);

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
    mutate(sourceFiles);
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="size-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Version Created Successfully!</h2>
          <p className="text-muted-foreground">
            Your contract folder has been uploaded and is ready for audit.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 h-full flex flex-col overflow-hidden w-full">
      <div className="flex flex-row justify-between items-end">
        <div className="text-left space-y-2">
          <div className="flex flex-row gap-4 justify-start items-center">
            <Code className="size-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-foreground">Smart Contract Folder</h2>
          </div>
          <p className="text-muted-foreground">
            Upload a folder containing your Solidity contract files
          </p>
        </div>
        <Button
          type="submit"
          disabled={isPending || sourceFiles.length === 0}
          className="min-w-40"
          onClick={handleSubmit}
        >
          {isPending ? (
            <div className="flex items-center space-x-2">
              <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>Create Version</span>
              <ArrowRight className="size-4" />
            </div>
          )}
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
                  <h3 className="text-lg font-medium text-foreground mb-2">Upload folder here</h3>
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
                <span className="text-sm font-medium text-foreground">Sources</span>
                <span className="text-xs text-neutral-500">({sourceFiles.length})</span>
              </div>
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="flex items-center space-x-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
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
                          ? "bg-neutral-800 text-foreground"
                          : "text-foreground hover:bg-neutral-800/50",
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
