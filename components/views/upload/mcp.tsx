"use client";

import { projectActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useFormReducer } from "@/hooks/useFormReducer";
import { isApiError } from "@/types/api";
import type { ProjectDetailedSchema } from "@/types/api/responses/business";
import { ProjectFormValues, projectFormSchema } from "@/utils/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Code, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";

type Phase = "form" | "guide";

const McpProjectStep: React.FC<{
  teamSlug: string;
  onCompleteClose: () => void;
}> = ({ teamSlug, onCompleteClose }) => {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>("form");
  const [project, setProject] = useState<ProjectDetailedSchema | null>(null);
  const snippetClipboard = useCopyToClipboard();

  const initialState: ProjectFormValues = {
    name: "",
    description: "",
    tags: "",
  };
  const { formState, setField, updateFormState } = useFormReducer<ProjectFormValues>(initialState);

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) =>
      projectActions.createProject(teamSlug, data).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ project: created, toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setProject(created);
      setPhase("guide");
    },
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    updateFormState({ type: "SET_ERRORS", errors: {} });

    const parsed = projectFormSchema.safeParse(formState.values);
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

    const tagParts = (parsed.data.tags ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!tagParts.includes("mcp")) tagParts.push("mcp");

    createProjectMutation.mutate({
      ...parsed.data,
      tags: tagParts.join(", "),
    });
  };

  const mcpConfigSnippet = useMemo(() => {
    if (!project) return "";
    return `{
  "mcpServers": {
    "bevor": {
      "command": "npx",
      "args": ["-y", "@bevor/mcp-server"],
      "env": {
        "BEVOR_API_KEY": "<paste-your-api-key>",
        "BEVOR_PROJECT_ID": "${project.id}"
      }
    }
  }
}`;
  }, [project]);

  if (phase === "guide" && project) {
    const apiSettingsHref = `/team/${teamSlug}/settings/api`;

    return (
      <>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Code className="size-5 shrink-0 text-orange-400" aria-hidden />
            <DialogTitle>MCP project ready</DialogTitle>
          </div>
          <DialogDescription>
            Use your team API key together with this project&apos;s ID to configure the MCP server.
            Both values are required.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
          <ol className="list-decimal space-y-4 pl-5 text-sm text-muted-foreground">
            <li className="pl-1">
              <span className="text-foreground">Create an API key</span> for this team. Keys are
              created on the API settings page and can be revoked anytime.
              <div className="mt-2">
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <Link href={apiSettingsHref}>
                    <ExternalLink className="size-4" />
                    Open API keys
                  </Link>
                </Button>
              </div>
            </li>
            <li className="pl-1">
              <span className="text-foreground">Install the MCP server</span> in your editor (for
              example Cursor, Zed, or another client that supports the Model Context Protocol). Add
              a server entry that runs the Bevor MCP package and passes environment variables for
              your key and this project ID.
            </li>
            <li className="pl-1">
              <span className="text-foreground">Paste configuration</span> similar to the following
              (adjust the command or package name to match the install instructions for your
              environment):
            </li>
          </ol>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Example MCP config</p>
            <div className="relative rounded-lg border border-border/60 bg-muted/40">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 size-8 text-muted-foreground hover:text-foreground"
                aria-label={snippetClipboard.isCopied ? "Copied" : "Copy configuration JSON"}
                onClick={() => snippetClipboard.copy(mcpConfigSnippet)}
              >
                {snippetClipboard.isCopied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
              <pre className="max-h-48 overflow-auto p-4 pr-12 text-xs leading-relaxed">
                <code>{mcpConfigSnippet}</code>
              </pre>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2 shrink-0 border-t border-border/60 pt-4 sm:justify-end">
          <Button type="button" onClick={onCompleteClose}>
            Done
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <Code className="size-5 shrink-0 text-orange-400" aria-hidden />
          <DialogTitle>New project for MCP</DialogTitle>
        </div>
        <DialogDescription>
          Create a dedicated project for IDE / MCP integration. After creation, you will set up a
          team API key and point the MCP server at this project ID.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="mcp-project-name" aria-required>
              Project name
            </FieldLabel>
            <Input
              id="mcp-project-name"
              type="text"
              name="name"
              value={formState.values.name}
              onChange={(e) => setField("name", e.target.value)}
              disabled={createProjectMutation.isPending}
              placeholder="MCP workspace"
              aria-invalid={!!formState.errors.name}
            />
            {formState.errors.name && (
              <p className="text-sm text-destructive">{formState.errors.name}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="mcp-project-description">Description</FieldLabel>
            <Textarea
              id="mcp-project-description"
              name="description"
              className="min-h-[80px] w-full"
              value={formState.values.description || ""}
              onChange={(e) => setField("description", e.target.value)}
              disabled={createProjectMutation.isPending}
              placeholder="Optional"
              aria-invalid={!!formState.errors.description}
            />
            {formState.errors.description && (
              <p className="text-sm text-destructive">{formState.errors.description}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="mcp-project-tags">Tags</FieldLabel>
            <Input
              id="mcp-project-tags"
              name="tags"
              type="text"
              value={formState.values.tags || ""}
              onChange={(e) => setField("tags", e.target.value)}
              disabled={createProjectMutation.isPending}
              placeholder="client-name, production"
              aria-invalid={!!formState.errors.tags}
            />
            <p className="text-xs text-muted-foreground">
              The tag <span className="font-mono">mcp</span> is added automatically.
            </p>
            {formState.errors.tags && (
              <p className="text-sm text-destructive">{formState.errors.tags}</p>
            )}
          </Field>
        </FieldGroup>

        {createProjectMutation.error && isApiError(createProjectMutation.error) && (
          <p className="text-sm text-destructive">{createProjectMutation.error.error.message}</p>
        )}

        <DialogFooter className="mt-auto shrink-0 border-t border-border/60 pt-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={createProjectMutation.isPending}
            onClick={onCompleteClose}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createProjectMutation.isPending}>
            {createProjectMutation.isPending ? "Creating…" : "Create project"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

export default McpProjectStep;
