"use client";

import { codeActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { useFormReducer } from "@/hooks/useFormReducer";
import { cn } from "@/lib/utils";
import type { ProjectDetailedSchema } from "@/types/api/responses/business";
import type { CreateCodeResponse } from "@/types/api/responses/graph";
import { PasteCodeFileFormValues, pasteCodeFileSchema } from "@/utils/schema";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { solidity } from "@replit/codemirror-lang-solidity";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { githubDark } from "@uiw/codemirror-theme-github";
import { basicSetup } from "codemirror";
import { ArrowRight, CheckCircle, FileEdit, Loader2, X, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ensureProject: () => Promise<ProjectDetailedSchema>,
  data: PasteCodeFileFormValues,
  mutate: (vars: PasteUploadVariables) => void,
): Promise<void> => {
  const project = await ensureProject();
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
    <div className={cn(className)}>
      <div className="border border-border rounded-lg min-h-20 overflow-scroll">
        <div ref={pasteEditorRef} role="region" aria-label="Solidity code editor" />
      </div>
      {error && (
        <div className="flex items-center space-x-2 text-destructive text-sm mt-4">
          <XCircle className="size-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

/** Full-screen write/paste step (editor + submit). Pair with {@link FileStep} for upload-only. */
export const PasteCodeStep: React.FC<{
  ensureProject: () => Promise<ProjectDetailedSchema>;
  parentId?: string;
  onSuccess?: (id: string) => void;
}> = ({ ensureProject, parentId, onSuccess }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pastePanelKey, setPastePanelKey] = useState(0);
  const pasteToastId = useRef<string | number>(undefined);

  const pasteInitialState: PasteCodeFileFormValues = {
    content: PASTE_TEMPLATE_CODE,
    parent_code_version_id: parentId,
  };
  const {
    formState,
    setField: setPasteField,
    updateFormState: updatePasteFormState,
  } = useFormReducer<PasteCodeFileFormValues>(pasteInitialState);

  const pasteMutation = useMutation({
    mutationFn: async ({
      project,
      data,
    }: PasteUploadVariables): Promise<
      CreateCodeResponse & { toInvalidate: QueryKey[]; project: ProjectDetailedSchema }
    > => {
      const r = await codeActions.contractUploadPaste(project.team.slug, project.id, data);
      if (!r.ok) throw r;
      return { ...r.data, project };
    },
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
    onSuccess: ({ id, status, toInvalidate, project, analysis_id }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success("Successfully uploaded code", {
        id: pasteToastId.current,
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

    void startPasteCodeUpload(ensureProject, parsed.data, pasteMutation.mutate).catch(() => {});
  }, [ensureProject, formState.values, pasteMutation, updatePasteFormState]);

  if (pasteMutation.isSuccess) {
    const { status, analysis_id: analysisId } = pasteMutation.data;
    if (analysisId && (status === "waiting" || status === "processing" || status === "success")) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Opening analysis…</p>
        </div>
      );
    }
  }

  if (
    pasteMutation.isSuccess &&
    pasteMutation.data.status === "success" &&
    !pasteMutation.data.analysis_id
  ) {
    const { project: proj, id: codeId } = pasteMutation.data;
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

  if (pasteMutation.isError) {
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
            <Button variant="outline" onClick={() => pasteMutation.reset()}>
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
            <FileEdit className="size-6 text-emerald-400" />
            <h2 className="text-2xl font-bold ">Write contract</h2>
          </div>
          <p className="text-muted-foreground">Paste or type Solidity in the editor</p>
        </div>
        <Button
          type="submit"
          disabled={!formState.values.content.trim() || pasteMutation.isPending}
          className="min-w-40"
          onClick={submitPaste}
        >
          <span>Submit</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <div className="flex flex-row justify-end items-center">
        <Button
          variant="outline"
          disabled={!formState.values.content.trim()}
          onClick={clearPasteContent}
        >
          <X className="size-3" />
          Clear
        </Button>
      </div>

      <PasteCodePanel
        key={pastePanelKey}
        content={formState.values.content}
        onContentChange={(v) => setPasteField("content", v)}
        error={formState.errors.code}
      />

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

export default PasteCodePanel;
