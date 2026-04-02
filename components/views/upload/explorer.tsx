"use client";

import { codeActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useFormReducer } from "@/hooks/useFormReducer";
import type { ProjectDetailedSchema } from "@/types/api/responses/business";
import { ScanCodeAddressFormValues, scanCodeAddressSchema } from "@/utils/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Globe, Loader2, XCircle } from "lucide-react";
import React, { useCallback, useRef } from "react";
import { toast } from "sonner";

type ScanUploadVariables = {
  project: ProjectDetailedSchema;
  data: ScanCodeAddressFormValues;
};

const startScanCodeUpload = async (
  ensureProject: () => Promise<ProjectDetailedSchema>,
  data: ScanCodeAddressFormValues,
  mutate: (vars: ScanUploadVariables) => void,
): Promise<void> => {
  const project = await ensureProject();
  mutate({ project, data });
};

const ContractAddressStep: React.FC<{
  ensureProject: () => Promise<ProjectDetailedSchema>;
  parentId?: string;
  onSuccess?: (id: string) => void;
}> = ({ ensureProject, parentId, onSuccess }) => {
  const queryClient = useQueryClient();

  const initialState: ScanCodeAddressFormValues = {
    address: "",
    parent_code_version_id: parentId,
  };
  const { formState, setField, updateFormState } =
    useFormReducer<ScanCodeAddressFormValues>(initialState);

  const toastId = useRef<string | number>(undefined);

  const mutation = useMutation({
    mutationFn: async ({ project, data }: ScanUploadVariables) =>
      codeActions.contractUploadScan(project.team.slug, project.id, data).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onMutate: () => {
      updateFormState({ type: "SET_ERRORS", errors: {} });
      toastId.current = toast.loading("Uploading and parsing code...");
    },
    onError: () => {
      toast.dismiss(toastId.current);
      updateFormState({
        type: "SET_ERRORS",
        errors: { address: "Something went wrong" },
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

  const submitScan = useCallback(() => {
    updateFormState({ type: "SET_ERRORS", errors: {} });

    const parsed = scanCodeAddressSchema.safeParse(formState.values);

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

    const encodedAddress = encodeURIComponent(parsed.data.address);
    void startScanCodeUpload(
      ensureProject,
      { ...parsed.data, address: encodedAddress },
      mutation.mutate,
    ).catch(() => {});
  }, [ensureProject, formState.values, mutation, updateFormState]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    submitScan();
  };

  if (mutation.isSuccess) {
    const { status, analysis_id: analysisId } = mutation.data;
    if (analysisId && (status === "waiting" || status === "processing" || status === "success")) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Opening analysis…</p>
        </div>
      );
    }
  }

  if (mutation.isError) {
    return (
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
          <Globe className="size-6 shrink-0 text-purple-400" aria-hidden />
          <h2 className="text-2xl font-bold tracking-tight">Explorer scan</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter a deployed, verified contract address. We fetch verified source and index it for
          analysis.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="address" aria-required>
              Contract address
            </FieldLabel>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Input
                id="address"
                name="address"
                type="text"
                value={formState.values.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="0x..."
                className="min-w-0 font-mono sm:flex-1"
                disabled={mutation.isPending}
                aria-invalid={!!formState.errors.address}
              />
              <Button
                type="submit"
                disabled={mutation.isPending || !formState.values.address.trim()}
                className="w-full min-w-40 shrink-0 sm:w-auto"
              >
                <span>Submit</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
            {formState.errors.address && (
              <div className="mt-3 flex items-start gap-2 text-sm text-destructive">
                <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{formState.errors.address}</span>
              </div>
            )}
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
};

export default ContractAddressStep;
