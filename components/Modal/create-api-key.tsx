"use client";

import { apiKeyActions } from "@/actions/bevor";
import ShowApiKeyModal from "@/components/Modal/show-api-key";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CreateKeyBody } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Key } from "lucide-react";
import React, { useState } from "react";

const CreateApiKeyModal: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  const queryClient = useQueryClient();
  const [showKey, setShowKey] = useState(false);

  const [createForm, setCreateForm] = useState<CreateKeyBody>({
    name: "",
    scopes: {
      project: "write",
      code: "write",
      analysis: "write",
      analysis_version: "write",
      chat: "write",
      user: "read",
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: async (data: CreateKeyBody) => apiKeyActions.createKey(teamSlug, data),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setShowKey(true);
    },
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    createKeyMutation.mutate(createForm);
  };

  const togglePermission = (permission: keyof CreateKeyBody["scopes"]): void => {
    if (permission === "user") return;
    setCreateForm({
      ...createForm,
      scopes: {
        ...createForm.scopes,
        [permission]: createForm.scopes[permission] === "write" ? "read" : "write",
      },
    });
  };

  if (showKey) {
    return <ShowApiKeyModal apiKey={createKeyMutation.data?.api_key ?? ""} />;
  }

  return (
    <>
      <DialogHeader>
        <div className="inline-flex gap-2 items-center">
          <Key className="size-5 text-blue-400" />
          <DialogTitle>Create API Key</DialogTitle>
        </div>
        <DialogDescription>Create a new API key for your team with custom scopes</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name" aria-required>
              API Key Name
            </FieldLabel>
            <Input
              id="name"
              name="name"
              type="text"
              className="bg-gray-900 rounded px-3 py-2 text-sm flex-1 w-full"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              disabled={createKeyMutation.isPending}
              required
              placeholder="Enter API key name"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="project-toggle">Project Access</FieldLabel>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {createForm.scopes.project === "write" ? "Write" : "Read"}
              </span>
              <Switch
                id="project-toggle"
                name="project-toggle"
                checked={createForm.scopes.project === "write"}
                onCheckedChange={() => togglePermission("project")}
                disabled={createKeyMutation.isPending}
              />
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="code-toggle">Code Access</FieldLabel>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {createForm.scopes.code === "write" ? "Write" : "Read"}
              </span>
              <Switch
                id="code-toggle"
                name="code-toggle"
                checked={createForm.scopes.code === "write"}
                onCheckedChange={() => togglePermission("code")}
                disabled={createKeyMutation.isPending}
              />
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="analysis-toggle">Analysis Access</FieldLabel>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {createForm.scopes.analysis === "write" ? "Write" : "Read"}
              </span>
              <Switch
                id="analysis-toggle"
                name="analysis-toggle"
                checked={createForm.scopes.analysis === "write"}
                onCheckedChange={() => togglePermission("analysis")}
                disabled={createKeyMutation.isPending}
              />
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="analysis-version-toggle">Analysis Version Access</FieldLabel>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {createForm.scopes.analysis_version === "write" ? "Write" : "Read"}
              </span>
              <Switch
                id="analysis-version-toggle"
                name="analysis-version-toggle"
                checked={createForm.scopes.analysis_version === "write"}
                onCheckedChange={() => togglePermission("analysis_version")}
                disabled={createKeyMutation.isPending}
              />
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="chat-toggle">Chat Access</FieldLabel>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {createForm.scopes.chat === "write" ? "Write" : "Read"}
              </span>
              <Switch
                id="chat-toggle"
                name="chat-toggle"
                checked={createForm.scopes.chat === "write"}
                onCheckedChange={() => togglePermission("chat")}
                disabled={createKeyMutation.isPending}
              />
            </div>
          </Field>
        </FieldGroup>

        {createKeyMutation.error && (
          <p className="text-sm text-destructive">{createKeyMutation.error.message}</p>
        )}

        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={createKeyMutation.isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={createKeyMutation.isPending || !createForm.name.trim()}>
            {createKeyMutation.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

export default CreateApiKeyModal;
