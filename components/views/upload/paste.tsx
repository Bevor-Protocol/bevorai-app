"use client";

import { codeActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFormReducer } from "@/hooks/useFormReducer";
import { cn } from "@/lib/utils";
import type { ProjectDetailedSchema } from "@/types/api/responses/business";
import { PasteCodeFileFormValues, pasteCodeFileSchema } from "@/utils/schema";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { solidity } from "@replit/codemirror-lang-solidity";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { githubDark } from "@uiw/codemirror-theme-github";
import { basicSetup } from "codemirror";
import { ArrowRight, FileEdit, Loader2, X, XCircle } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const PASTE_TEMPLATE_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract ExampleContract {}`;

type PasteUploadVariables = {
  project: ProjectDetailedSchema;
  data: PasteCodeFileFormValues;
};

const startPasteCodeUpload = async (
  ensureProject: (tags: string[]) => Promise<ProjectDetailedSchema>,
  tags: string[],
  data: PasteCodeFileFormValues,
  mutate: (vars: PasteUploadVariables) => void,
): Promise<void> => {
  const project = await ensureProject(tags);
  mutate({ project, data });
};

/**
 * Write tab: CodeMirror editor and field error display.
 * Remount (`key` from parent) when the document must be replaced from outside the editor.
 */
const PasteCodePanel: React.FC<{
  content: string;
  onContentChange: (value: string) => void;
  error?: string;
  className?: string;
}> = ({ content, onContentChange, error, className }) => {
  const pasteEditorRef = useRef<HTMLDivElement>(null);
  const pasteViewRef = useRef<EditorView | null>(null);
  const onContentChangeRef = useRef(onContentChange);
  onContentChangeRef.current = onContentChange;

  useEffect(() => {
    if (!pasteEditorRef.current) return;
    if (pasteViewRef.current) {
      pasteViewRef.current.destroy();
    }

    const state = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        solidity,
        githubDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onContentChangeRef.current(update.state.doc.toString());
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only; parent remounts via `key` for template reset
  }, []);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}>
      <div className="flex min-h-[min(40vh,280px)] flex-1 flex-col overflow-hidden rounded-md">
        <div
          ref={pasteEditorRef}
          className="h-full min-h-[240px]"
          role="region"
          aria-label="Solidity code editor"
        />
      </div>
      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

/** Full-screen write/paste step (editor + submit). Pair with {@link FileStep} for upload-only. */
export const PasteCodeStep: React.FC<{
  ensureProject: (tags: string[]) => Promise<ProjectDetailedSchema>;
  parentId?: string;
  parentAnalysisId?: string;
  onSuccess?: (id: string) => void;
}> = ({ ensureProject, parentId, parentAnalysisId, onSuccess }) => {
  const queryClient = useQueryClient();
  const [pastePanelKey, setPastePanelKey] = useState(0);
  const pasteToastId = useRef<string | number>(undefined);

  const pasteInitialState: PasteCodeFileFormValues = {
    content: PASTE_TEMPLATE_CODE,
    parent_code_version_id: parentId,
    parent_analysis_id: parentAnalysisId,
  };
  const {
    formState,
    setField: setPasteField,
    updateFormState: updatePasteFormState,
  } = useFormReducer<PasteCodeFileFormValues>(pasteInitialState);

  const pasteMutation = useMutation({
    mutationFn: async ({ project, data }: PasteUploadVariables) =>
      codeActions.contractUploadPaste(project.team.slug, project.id, data).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
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
    onSuccess: ({ analysis_id, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Successfully uploaded code", {
        id: pasteToastId.current,
      });
      if (analysis_id) onSuccess?.(analysis_id);
    },
  });

  const bumpEditor = useCallback(() => {
    setPastePanelKey((k) => k + 1);
  }, []);

  const clearPasteContent = useCallback(() => {
    setPasteField("content", PASTE_TEMPLATE_CODE);
    updatePasteFormState({ type: "SET_ERRORS", errors: {} });
    bumpEditor();
  }, [bumpEditor, setPasteField, updatePasteFormState]);

  const submitPaste = useCallback(() => {
    updatePasteFormState({ type: "SET_ERRORS", errors: {} });

    const parsed = pasteCodeFileSchema.safeParse(formState.values);

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

    void startPasteCodeUpload(
      ensureProject,
      ["manual-file"],
      parsed.data,
      pasteMutation.mutate,
    ).catch(() => {});
  }, [ensureProject, formState.values, pasteMutation, updatePasteFormState]);

  const pasteData = pasteMutation.data;
  const showOpeningAnalysis =
    pasteMutation.isSuccess &&
    !!pasteData?.analysis_id &&
    (pasteData.status === "waiting" ||
      pasteData.status === "processing" ||
      pasteData.status === "success");

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <FileEdit className="size-5 shrink-0 text-emerald-400" aria-hidden />
          <DialogTitle>Write code</DialogTitle>
        </div>
        <DialogDescription>
          Paste or type code in the editor. Submit uploads the current buffer for parsing and
          analysis. Only solidity currently supported.
        </DialogDescription>
      </DialogHeader>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
        {showOpeningAnalysis ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Opening analysis…</p>
          </div>
        ) : pasteMutation.isError ? (
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
                <Button variant="outline" onClick={() => pasteMutation.reset()}>
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/60 bg-muted/15 p-1 sm:p-2">
              <PasteCodePanel
                key={pastePanelKey}
                content={formState.values.content}
                onContentChange={(v) => setPasteField("content", v)}
                error={formState.errors.code}
                className="min-h-0"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={!formState.values.content.trim() || pasteMutation.isPending}
                onClick={clearPasteContent}
              >
                <X className="size-3.5" />
                Clear
              </Button>
              <Button
                type="button"
                className="w-full min-w-40 sm:w-auto"
                disabled={!formState.values.content.trim() || pasteMutation.isPending}
                onClick={submitPaste}
              >
                <span>Submit</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </>
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
    </>
  );
};

export default PasteCodeStep;
