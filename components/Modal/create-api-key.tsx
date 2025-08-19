"use client";

import { bevorAction } from "@/actions";
import ShowApiKeyModal from "@/components/Modal/show-api-key";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModal } from "@/hooks/useContexts";
import { CreateKeyBody } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Key, X } from "lucide-react";
import React, { useState } from "react";

const CreateApiKeyModal: React.FC = () => {
  const queryClient = useQueryClient();
  const { show, hide } = useModal();
  const [createForm, setCreateForm] = useState<CreateKeyBody>({
    name: "",
    permissions: {
      project: "write",
      contract: "write",
      audit: "write",
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: async (data: CreateKeyBody) => bevorAction.createKey(data),
    onSuccess: ({ api_key }) => {
      show(<ShowApiKeyModal apiKey={api_key} />);
      queryClient.invalidateQueries({ queryKey: ["team-api-keys"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    createKeyMutation.mutate(createForm);
  };

  const getScopeLabel = (scope: string): string => {
    switch (scope) {
      case "read":
        return "Read";
      case "write":
        return "Write";
      case "none":
        return "None";
      default:
        return scope;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="justify-center flex flex-col gap-2">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800 w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-100">Create API Key</h2>
            <p className="text-sm text-neutral-400">
              Create a new API key for your team with custom permissions
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={hide}
          disabled={createKeyMutation.isPending}
          className="p-2 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="py-4 space-y-4">
        <div className="space-y-2">
          <label className="text-md font-medium text-neutral-200">
            API Key Name <span className="text-red-400">*</span>
          </label>
          <Input
            type="text"
            className="bg-gray-900 rounded px-3 py-2 text-sm flex-1 w-full"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            disabled={createKeyMutation.isPending}
            required
            placeholder="Enter API key name"
          />
        </div>

        <div className="space-y-3">
          <label className="text-md font-medium text-neutral-200">Permissions</label>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Project Access
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["read", "write", "none"] as const).map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() =>
                      setCreateForm({
                        ...createForm,
                        permissions: { ...createForm.permissions, project: scope },
                      })
                    }
                    className={`px-3 py-2 text-xs rounded border transition-colors ${
                      createForm.permissions.project === scope
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : "border-neutral-700 text-neutral-400 hover:border-neutral-600"
                    }`}
                  >
                    {getScopeLabel(scope)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Contract Access
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["read", "write", "none"] as const).map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() =>
                      setCreateForm({
                        ...createForm,
                        permissions: { ...createForm.permissions, contract: scope },
                      })
                    }
                    className={`px-3 py-2 text-xs rounded border transition-colors ${
                      createForm.permissions.contract === scope
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : "border-neutral-700 text-neutral-400 hover:border-neutral-600"
                    }`}
                  >
                    {getScopeLabel(scope)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Audit Access
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["read", "write", "none"] as const).map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() =>
                      setCreateForm({
                        ...createForm,
                        permissions: { ...createForm.permissions, audit: scope },
                      })
                    }
                    className={`px-3 py-2 text-xs rounded border transition-colors ${
                      createForm.permissions.audit === scope
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : "border-neutral-700 text-neutral-400 hover:border-neutral-600"
                    }`}
                  >
                    {getScopeLabel(scope)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {createKeyMutation.error && (
          <p className="text-sm text-red-400">{createKeyMutation.error.message}</p>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t border-neutral-800">
        <Button type="button" variant="dark" onClick={hide} disabled={createKeyMutation.isPending}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="bright"
          disabled={createKeyMutation.isPending || !createForm.name.trim()}
        >
          {createKeyMutation.isPending ? "Creating..." : "Create API Key"}
        </Button>
      </div>
    </form>
  );
};

export default CreateApiKeyModal;
