"use client";

import { versionActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { navigation } from "@/utils/navigation";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { solidity } from "@replit/codemirror-lang-solidity";
import { useMutation } from "@tanstack/react-query";
import { githubDark } from "@uiw/codemirror-theme-github";
import { basicSetup } from "codemirror";
import { ArrowRight, CheckCircle, Upload, X, XCircle } from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";

const templateCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract ExampleContract {}`;

interface SourceFile {
  file: File;
  content: string;
}

const FileStep: React.FC<{
  teamId: string;
  projectId: string;
  prevStep: () => void;
}> = ({ prevStep, ...props }) => {
  const [contractCode, setContractCode] = useState(templateCode);
  const [uploadedFile, setUploadedFile] = useState<SourceFile | null>(null);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: { code?: string; file?: File }) => {
      if (data.file) {
        return versionActions.contractUploadFile(props.teamId, props.projectId, data.file);
      } else if (data.code) {
        return versionActions.contractUploadPaste(props.teamId, props.projectId, data.code);
      }
      throw new Error("No file or code provided");
    },
    onError: () => {
      setError("Failed to upload contract");
    },
  });

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current) return;
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const state = EditorState.create({
      doc: contractCode,
      extensions: [
        basicSetup,
        solidity,
        githubDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setContractCode(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: editorRef.current });
    viewRef.current = view;

    return (): void => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, uploadedFile]);

  const handleFileUpload = useCallback(async (file: File): Promise<void> => {
    if (!file.name.endsWith(".sol") && !file.name.endsWith(".js") && !file.name.endsWith(".ts")) {
      setError("Please upload a .sol, .js, or .ts file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e): void => {
      const content = e.target?.result as string;
      setContractCode(content);
      setUploadedFile({ file, content });
      setError("");
    };
    reader.onerror = (): void => setError("Failed to read file");
    reader.readAsText(file);
  }, []);

  const clearContent = useCallback((): void => {
    setContractCode(templateCode);
    setUploadedFile(null);
    setError("");
  }, []);

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
        if (files.length > 1) {
          setError("Please upload only one file at a time");
          return;
        }
        await handleFileUpload(files[0]);
      }
    },
    [handleFileUpload],
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        if (files.length > 1) {
          setError("Please upload only one file at a time");
          return;
        }
        await handleFileUpload(files[0]);
      }
    },
    [handleFileUpload],
  );

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    if (activeTab === "upload" && !uploadedFile) {
      setError("Please upload a file");
      return;
    }

    if (activeTab === "paste" && !contractCode.trim()) {
      setError("Please enter contract code");
      return;
    }

    setError("");

    if (activeTab === "upload" && uploadedFile) {
      mutation.mutate({ file: uploadedFile.file });
    } else {
      mutation.mutate({ code: contractCode });
    }
  };

  const handleToggle = (value: string): void => {
    setActiveTab(value as "upload" | "paste");
    setContractCode(templateCode);
    setUploadedFile(null);
    setError("");
  };

  if (mutation.isSuccess) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle className="size-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Version Created Successfully!</h2>
          <p className="text-muted-foreground">
            Your contract has been uploaded and is ready for audit.
          </p>
          <Button asChild className="mt-4">
            <Link
              href={navigation.code.overview({
                teamId: props.teamId,
                versionId: mutation.data,
              })}
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
          <h2 className="text-2xl font-bold text-foreground">Upload Failed</h2>
          <p className="text-muted-foreground">
            There was an error processing your contract. Please try again.
          </p>
          <div className="flex gap-4 justify-center mt-6">
            <Button variant="outline" onClick={prevStep}>
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
            <h2 className="text-2xl font-bold text-foreground">Smart Contract File</h2>
          </div>
          <p className="text-muted-foreground">
            Write, paste, or upload your Solidity contract code below
          </p>
        </div>
        <Button
          type="submit"
          disabled={activeTab === "upload" ? !uploadedFile : !contractCode.trim()}
          className="min-w-40"
          onClick={handleSubmit}
        >
          <span>Create Version</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <Tabs onValueChange={handleToggle} defaultValue="upload">
        <div className="flex flex-row justify-between items-center">
          <TabsList>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="paste">Write</TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            disabled={activeTab == "upload" ? !uploadedFile : !contractCode.trim()}
            onClick={clearContent}
          >
            <X className="size-3" />
            Clear
          </Button>
        </div>
        <TabsContent value="upload">
          {!uploadedFile && (
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
                    <h3 className="text-lg font-medium text-foreground mb-2">Upload files here</h3>
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
          {uploadedFile && (
            <div className="border border-border rounded-lg min-h-20 overflow-scroll">
              <div ref={editorRef} role="region" aria-label="Solidity code editor" />
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 text-red-400 text-sm mt-4">
              <XCircle className="size-4" />
              <span>{error}</span>
            </div>
          )}
        </TabsContent>
        <TabsContent value="paste">
          <div className="border border-border rounded-lg min-h-20 overflow-scroll">
            <div ref={editorRef} role="region" aria-label="Solidity code editor" />
          </div>
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
