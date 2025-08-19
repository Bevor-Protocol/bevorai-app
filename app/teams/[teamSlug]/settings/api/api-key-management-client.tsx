"use client";

import { bevorAction } from "@/actions";
import CreateApiKeyModal from "@/components/Modal/create-api-key";
import ShowApiKeyModal from "@/components/Modal/show-api-key";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/useContexts";
import { AuthSchema } from "@/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Key, Plus, RefreshCw, Trash2 } from "lucide-react";

const ApiKeyManagementClient: React.FC = () => {
  const { show } = useModal();

  const queryClient = useQueryClient();

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ["team-api-keys"],
    queryFn: async () => {
      return await bevorAction.listKeys();
    },
  });

  const regenerateApiKeyMutation = useMutation({
    mutationFn: async (apiKeyId: string) => bevorAction.refreshKey(apiKeyId),
    onSuccess: ({ api_key }) => {
      show(<ShowApiKeyModal apiKey={api_key} />);
      queryClient.invalidateQueries({ queryKey: ["team-api-keys"] });
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async (apiKeyId: string) => bevorAction.revokeKey(apiKeyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-api-keys"] });
    },
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDeleteApiKey = (apiKey: AuthSchema): void => {
    const confirmMessage = `Are you sure you want to delete the API key "${apiKey.name}" (${apiKey.prefix}...)? This action cannot be undone.`;
    if (confirm(confirmMessage)) {
      deleteApiKeyMutation.mutate(apiKey.id);
    }
  };

  const handleModal = (): void => {
    show(<CreateApiKeyModal />);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-4">
        <div className="flex flex-row mb-8 justify-between">
          <h3 className="text-xl font-semibold text-neutral-100">API Keys</h3>
          <Button variant="bright" onClick={handleModal} className="text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create API Key
          </Button>
        </div>
        <p className="text-neutral-400">
          API keys allow you to integrate with our API for MCP, CI/CD, and other automation.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-neutral-400 mt-4">Loading API keys...</p>
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-12">
          <Key className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-100 mb-2">No API Keys</h3>
        </div>
      ) : (
        <div className="border border-blue-500/50 rounded divide-blue-500/25 divide-y">
          {apiKeys.map((apiKey) => (
            <div
              key={apiKey.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0">
                  <Key className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex flex-col space-y-1">
                  <div className="text-sm font-medium text-neutral-100">{apiKey.name}</div>
                  <div className="text-xs text-neutral-400">
                    Created {formatDate(apiKey.created_at)}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                <code className="text-xs font-mono bg-neutral-900 text-green-400 px-3 py-1.5 rounded-md border border-neutral-700 tracking-wider whitespace-nowrap">
                  sk_{apiKey.prefix}•••••••••••••••••••••••••••••
                </code>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="dark"
                    onClick={() => regenerateApiKeyMutation.mutate(apiKey.id)}
                    disabled={regenerateApiKeyMutation.isPending}
                    className="text-xs h-8 px-3"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                  <Button
                    variant="dark"
                    onClick={() => handleDeleteApiKey(apiKey)}
                    disabled={deleteApiKeyMutation.isPending}
                    className="text-red-400 hover:bg-red-500/10 text-xs h-8 px-3"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiKeyManagementClient;
